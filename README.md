Sistema de monitoreo y gestión de energía generada por paneles solares mediante
microcontroladores.
Descripción
Este sistema informático está orientado al monitoreo y visualización de
información energética de instalaciones fotovoltaicas de pequeña escala.
El sistema integra una aplicación web desarrollada con React y Vite, un backend
Node.js y Express, una base de datos PostgreSQL mediante Prisma ORM y una
arquitectura de comunicación IoT basada en ESP32 y MQTT.

Actualmente, el prototipo presenta un avance funcional significativo y utiliza
datos simulados de generación, consumo y excedentes energéticos en corriente continua.

Acceso a la aplicación web

Plataforma: Vercel

Enlace: https://sistema-de-monitoreo-por-microcontr.vercel.app/
Permite acceder a la interfaz del sistema y explorar las funcionalidades implementadas.


Instructivo con usuarios generados
Se cargaron tres usuarios para el testeo del sistema y se cargó una instalación
asociado a un nodo. Un usuario es el usuario propietario, es decir el usuario dueño de la
instalación fotovoltaica, el mismo accede directamente a la información que se está
generando a partir de sus instalaciones.

Los usuarios registrados son los siguientes:

Propietario, acceder desde login con los siguientes datos:
Correo electrónico: hyru384@gmail.com
Contraseña: Probando123
Una vez ingresado podrá visualizar la información del dashboard, notara que la
información mostrada es la ultima y el grafico representa las últimas mediciones.
Dado que se conecta localmente el esp32, se ira cargando la información cuando
lo encienda en periodos de tiempos de una vez por semana para mantener activa la base
de datos de posgretSQL, dado que Supabase, al no estar activo, pone en stanby la cuenta.
Desde este usuario se puede visualizar que posee activo el botón de administrar
accesos, el cual en este momento se encuentra con permiso, otro usuario, que es
invitado@smartgrid.com, si se quiere se puede revocar el permiso.
Otros usuarios creados son los siguientes:
Correo electrónico: invitado@smartgrid.com
Contraseña: pruebaInvitado123
Correo electrónico: invitadodos@smartgrid.com
Contraseña: 1234Invitado
Se pueden crear usuarios a gusto, también pueden pasar a ser propietarios.
En el caso que se quiera adaptar un ESP32 para simular se tiene que cargar el
archivo esp32mqtt.ino en un modulo ESP32 de 30 pines, puede ser también otro modelo,
el archivo subido posee datos secretos, dado que hay que configurar la red wifi local para
utilizarlo.
const char* ssid = "nombre de la red wifi, tiene que ser una red de 2,4ghz no utilizar red
5,8ghz";
const char* password = "contraseña de wifi";
const char* mqtt_server = "iplocal del dispositivo que tendrá el bróker Mosquitto";
también por temas de seguridad, no esta subido el archivo .env, donde se alojara la
información de la base de datos, encriptación y datos de la API.
