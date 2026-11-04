-- AlterTable
ALTER TABLE "Instalacion" ADD COLUMN     "propietarioId" INTEGER;

-- CreateTable
CREATE TABLE "Nodo" (
    "id" SERIAL NOT NULL,
    "identificador" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "instalacionId" INTEGER NOT NULL,

    CONSTRAINT "Nodo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccesoInstalacion" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "instalacionId" INTEGER NOT NULL,

    CONSTRAINT "AccesoInstalacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Nodo_identificador_key" ON "Nodo"("identificador");

-- CreateIndex
CREATE UNIQUE INDEX "AccesoInstalacion_usuarioId_instalacionId_key" ON "AccesoInstalacion"("usuarioId", "instalacionId");

-- AddForeignKey
ALTER TABLE "Instalacion" ADD CONSTRAINT "Instalacion_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nodo" ADD CONSTRAINT "Nodo_instalacionId_fkey" FOREIGN KEY ("instalacionId") REFERENCES "Instalacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccesoInstalacion" ADD CONSTRAINT "AccesoInstalacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccesoInstalacion" ADD CONSTRAINT "AccesoInstalacion_instalacionId_fkey" FOREIGN KEY ("instalacionId") REFERENCES "Instalacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
