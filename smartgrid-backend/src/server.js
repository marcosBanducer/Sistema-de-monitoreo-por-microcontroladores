
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

const PORT = process.env.PORT || 3000;

// MIDDLEWARE

const origenesPermitidos = [
  "http://localhost:5173",
  "https://sistema-de-monitoreo-por-microcontr.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir solicitudes sin Origin (por ejemplo, Postman)
      if (!origin) {
        return callback(null, true);
      }

      const esOrigenPermitido =
        origenesPermitidos.includes(origin);

      // Mantener compatibilidad con previews del proyecto
      const esPreviewVercel =
        /^https:\/\/sistema-de-monitoreo-por-microcontroladores-[a-z0-9-]+\.vercel\.app$/.test(origin);

      if (esOrigenPermitido || esPreviewVercel) {
        return callback(null, true);
      }

      console.warn("Origen bloqueado por CORS:", origin);
      return callback(new Error("Origen no permitido por CORS"));
    },
  })
);


app.use(express.json());

// RUTAS DE USUARIOS E INSTALACIONES
app.use("/api/usuarios", crearRutasUsuarios(prisma));
app.use("/api/instalaciones", crearRutasInstalaciones(prisma));

// RUTA PRINCIPAL
app.get("/", (req, res) => {
  res.json({
    mensaje: "API SmartGrid funcionando"
  });
});

// CONSULTAR MEDICIONES DEL USUARIO AUTENTICADO
app.get("/api/mediciones", autenticar, async (req, res) => {
  try {
    const instalaciones = await prisma.instalacion.findMany({
      where: {
        OR: [
          { propietarioId: req.usuarioId },
          {
            accesos: {
              some: { usuarioId: req.usuarioId }
            }
          }
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

const crypto = require("crypto");

// RECIBIR MEDICIONES DESDE EL PUENTE MQTT
app.post("/api/mediciones/ingesta", async (req, res) => {
  try {
    const claveConfigurada = process.env.SMARTGRID_INGEST_KEY;
    const claveRecibida = req.get("X-Device-Key");

    if (!claveConfigurada) {
      console.error("SMARTGRID_INGEST_KEY no configurada");
      return res.status(503).json({
        error: "Servicio de ingesta no configurado"
      });
    }

    const esperada = Buffer.from(claveConfigurada, "utf8");
    const recibida = Buffer.from(claveRecibida || "", "utf8");

    if (
      esperada.length !== recibida.length ||
      !crypto.timingSafeEqual(esperada, recibida)
    ) {
      return res.status(401).json({
        error: "Dispositivo no autorizado"
      });
    }

    const { nodo, tension, corriente } = req.body || {};

    if (
      typeof nodo !== "string" ||
      !nodo.trim() ||
      typeof tension !== "number" ||
      typeof corriente !== "number" ||
      !Number.isFinite(tension) ||
      !Number.isFinite(corriente) ||
      tension < 0 ||
      corriente < 0
    ) {
      return res.status(400).json({
        error: "Datos de medicion invalidos"
      });
    }

    // Verificar que el nodo pertenezca a una instalacion
    const nodoRegistrado = await prisma.nodo.findUnique({
      where: { identificador: nodo.trim() }
    });

    if (!nodoRegistrado) {
      return res.status(404).json({
        error: "Nodo no registrado"
      });
    }

    // Calcular potencia en el servidor
    const potencia = Number(
      (tension * corriente).toFixed(2)
    );

    const balance = simularConsumo(potencia);

    const medicion = await prisma.medicion.create({
      data: {
        nodo: nodoRegistrado.identificador,
        tension,
        corriente,
        potencia,
        consumo: balance.consumo,
        excedente: balance.excedente,
        deficit: balance.deficit,
        origenConsumo: balance.origenConsumo
      }
    });

    console.log("Medicion recibida desde MQTT:", medicion.id);

    return res.status(201).json({
      mensaje: "Medicion guardada",
      id: medicion.id,
      nodo: medicion.nodo,
      fechaHora: medicion.fechaHora
    });

  } catch (error) {
    console.error("Error en ingesta MQTT:", error);

    return res.status(500).json({
      error: "Error al guardar la medicion"
    });
  }
});

// MQTT OPCIONAL
if (process.env.MQTT_ENABLED === "true") {
  const mqttUrl = process.env.MQTT_URL || "mqtt://localhost:1883";

  const mqttOptions = {};

  if (process.env.MQTT_USERNAME) {
    mqttOptions.username = process.env.MQTT_USERNAME;
  }

  if (process.env.MQTT_PASSWORD) {
    mqttOptions.password = process.env.MQTT_PASSWORD;
  }

  const mqttClient = mqtt.connect(mqttUrl, mqttOptions);

  mqttClient.on("connect", () => {
    console.log("Conectado al broker MQTT");

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
} else {
  console.log("MQTT deshabilitado en este entorno");
}

// INICIAR SERVIDOR
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API SmartGrid funcionando en puerto ${PORT}`);
});

