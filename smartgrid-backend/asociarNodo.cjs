
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // Consultar las instalaciones existentes
  const instalaciones = await prisma.instalacion.findMany({
    select: {
      id: true,
      nombre: true,
      propietarioId: true
    }
  });

  console.log("Instalaciones disponibles:");
  console.table(instalaciones);

  // Cambiar por el ID real de tu instalación
  const instalacionId = 1;

  const instalacion = instalaciones.find(
    (item) => item.id === instalacionId
  );

  if (!instalacion) {
    throw new Error("La instalación seleccionada no existe");
  }

  // Crear el nodo o actualizar su asociación
  const nodo = await prisma.nodo.upsert({
    where: {
      identificador: "nodo1"
    },
    update: {
      nombre: "ESP32 Solar 1",
      instalacionId
    },
    create: {
      identificador: "nodo1",
      nombre: "ESP32 Solar 1",
      instalacionId
    }
  });

  console.log("Nodo asociado correctamente:");
  console.table([nodo]);
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
