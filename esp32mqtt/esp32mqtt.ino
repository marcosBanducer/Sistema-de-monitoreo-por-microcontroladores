
#include <WiFi.h>
#include <PubSubClient.h>
#include "secrets.h"

const int mqtt_port = 1883;

//el esp32 conectado a nodo1 donde envia toda las mediciones
const char* mqtt_topic = "smartgrid/nodo1/medicion";

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long ultimoEnvio = 0;
const unsigned long intervalo = 5000;

// CONECTAR WIFI
void conectarWiFi() {
  Serial.print("Conectando a WiFi");

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi conectado");
  Serial.print("IP ESP32: ");
  Serial.println(WiFi.localIP());
}

// CONECTAR MQTT
void conectarMQTT() {
  while (!client.connected()) {
    Serial.print("Conectando a Mosquitto... ");

    String clientId = "SmartGrid-ESP32-";
    clientId += WiFi.macAddress();

    if (client.connect(clientId.c_str())) {
      Serial.println("Conectado");
    } else {
      Serial.print("Error MQTT: ");
      Serial.println(client.state());
      delay(3000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  conectarWiFi();

  client.setServer(mqtt_server, mqtt_port);
}

void loop() {

  if (WiFi.status() != WL_CONNECTED) {
    conectarWiFi();
  }

  if (!client.connected()) {
    conectarMQTT();
  }

  client.loop();

  if (millis() - ultimoEnvio >= intervalo) {
    ultimoEnvio = millis();

    // DATOS SIMULADOS
    float tension = 12.0 + random(0, 300) / 100.0;
    float corriente = 1.0 + random(0, 200) / 100.0;

    // CONSTRUIR JSON
    char mensaje[160];

    snprintf(
      mensaje,
      sizeof(mensaje),
      "{\"nodo\":\"nodo1\",\"tension\":%.2f,\"corriente\":%.2f}",
      tension,
      corriente
    );

    // PUBLICAR EN MQTT
    bool enviado = client.publish(mqtt_topic, mensaje);

    if (enviado) {
      Serial.print("Mensaje enviado: ");
      Serial.println(mensaje);
    } else {
      Serial.println("Error al publicar MQTT");
    }
  }
}
