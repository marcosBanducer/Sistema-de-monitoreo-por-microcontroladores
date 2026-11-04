
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mqtt = require("mqtt");
const { PrismaClient } = require("@prisma/client");
const { crearRutasUsuarios } = require("./endpoint");
const { crearRutasInstalaciones } = require("./instalaciones");
const { autenticar } = require("./middleware/auth");
const { simularConsumo } = require("./simularConsumo");
const app = express();
const prisma = new PrismaClient();

const PORT = 3000;

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// RUTAS DE USUARIOS
app.use("/api/usuarios", crearRutasUsuarios(prisma));
app.use("/api/instalaciones", crearRutasInstalaciones(prisma));
// RUTA PRINCIPAL
app.get("/", (req, res) => {
  res.json({
    mensaje: "API SmartGrid funcionando"
  });
});

app.get("/api/mediciones", autenticar, async (req, res) => {
  try {
    const instalaciones = await prisma.instalacion.findMany({
      where: {
        OR: [
          { propietarioId: req.usuarioId },
          { accesos: { some: { usuarioId: req.usuarioId } } }
        ]
      },
      include: {
        nodos: {
          select: { identificador: true }
        }
      }
    });

    const identificadores = [
      ...new Set(
        instalaciones.flatMap((instalacion) =>
          instalacion.nodos.map((nodo) => nodo.identificador)
        )
      )
    ];

    const mediciones = await prisma.medicion.findMany({
      where: {
        nodo: { in: identificadores }
      },
      orderBy: { fechaHora: "desc" },
      take: 500
    });

    res.json(mediciones);
  } catch (error) {
    console.error("Error consultando mediciones:", error);
    res.status(500).json({
      error: "Error al consultar mediciones"
    });
  }
});

// CONSULTAR INSTALACIONES
/*app.get("/api/instalaciones", async (req, res) => {
  try {
    const instalaciones = await prisma.instalacion.findMany({
      orderBy: { fechaAlta: "desc" }
    });

    res.json(instalaciones);
  } catch (error) {
    console.error("Error consultando instalaciones:", error);
    res.status(500).json({
      error: "Error al consultar instalaciones"
    });
  }
});*/

/*
app.post("/api/instalaciones", async (req, res) => {
  try {
    const { nombre, ubicacion, descripcion } = req.body;

    if (
      typeof nombre !== "string" ||
      typeof ubicacion !== "string" ||
      !nombre.trim() ||
      !ubicacion.trim()
    ) {
      return res.status(400).json({
        error: "Nombre y ubicación son obligatorios"
      });
    }

    const instalacion = await prisma.instalacion.create({
      data: {
        nombre: nombre.trim(),
        ubicacion: ubicacion.trim(),
        descripcion:
          typeof descripcion === "string"
            ? descripcion.trim()
            : null
      }
    });

    res.status(201).json(instalacion);
  } catch (error) {
    console.error("Error creando instalación:", error);
    res.status(500).json({
      error: "Error al registrar instalación"
    });
  }
});*/

// CONEXIÓN MQTT
const mqttClient = mqtt.connect("mqtt://localhost:1883");

mqttClient.on("connect", () => {
  console.log("Conectado a Mosquitto");

  mqttClient.subscribe("smartgrid/nodo1/medicion", (error) => {
    if (error) {
      console.error("Error de suscripción MQTT:", error);
    } else {
      console.log("Suscripto a smartgrid/nodo1/medicion");
    }
  });
});

mqttClient.on("error", (error) => {
  console.error("Error MQTT:", error.message);
});

mqttClient.on("message", async (topic, message) => {
  try {
    const datos = JSON.parse(message.toString());

    if (datos.tension == null || datos.corriente == null) {
      return;
    }

    const tension = Number(datos.tension);
    const corriente = Number(datos.corriente);

    if (
      !Number.isFinite(tension) ||
      !Number.isFinite(corriente)
    ) {
      return;
    }

    const potencia = Number(
      (tension * corriente).toFixed(2)
    );
const balance = simularConsumo(potencia);
  const medicion = await prisma.medicion.create({
  data: {
    nodo: datos.nodo || "nodo1",
    tension,
    corriente,
    potencia,
    consumo: balance.consumo,
    excedente: balance.excedente,
    deficit: balance.deficit,
    origenConsumo: balance.origenConsumo
  }
});

    console.log("Medición MQTT guardada:", medicion.id);
  } catch (error) {
    console.error("Error procesando MQTT:", error);
  }
});

// INICIAR SERVIDOR
app.listen(PORT, () => {
  console.log(
    `API SmartGrid funcionando en http://localhost:${PORT}`
  );
});
