const mqtt = require("mqtt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const client = mqtt.connect("mqtt://localhost:1883");

client.on("connect", () => {

  console.log("Conectado a Mosquitto");

  client.subscribe("smartgrid/nodo1/medicion", (err) => {

    if (err) {
      console.error("Error al suscribirse:", err);
      return;
    }

    console.log("Suscripto a smartgrid/nodo1/medicion");

  });

});

client.on("message", async (topic, message) => {

  try {

    const datos = JSON.parse(message.toString());

    console.log("Datos recibidos:");
    console.log(datos);

    const medicion = await prisma.medicion.create({
      data: {
        nodo: "nodo1",
        tension: datos.tension,
        corriente: datos.corriente,
        potencia: datos.potencia
      }
    });

    console.log("Medición guardada:", medicion);

  } catch (error) {

    console.error("Error:", error);

  }

});