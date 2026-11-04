
const mqtt = require("mqtt");

const cliente = mqtt.connect("mqtt://localhost:1883");

cliente.on("connect", () => {
  console.log("Conectado a Mosquitto");

  const medicion = {
    nodo: "nodo1",
    tension: 24,
    corriente: 2.5
  };

  cliente.publish(
    "smartgrid/nodo1/medicion",
    JSON.stringify(medicion),
    { qos: 1 },
    (error) => {
      if (error) {
        console.error("Error al publicar:", error);
      } else {
        console.log("Medición enviada correctamente:", medicion);
      }

      cliente.end();
    }
  );
});

cliente.on("error", (error) => {
  console.error("Error MQTT:", error.message);
  cliente.end();
});
