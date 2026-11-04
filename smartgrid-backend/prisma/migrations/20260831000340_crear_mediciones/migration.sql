-- CreateTable
CREATE TABLE "mediciones" (
    "id" SERIAL NOT NULL,
    "nodo" TEXT NOT NULL,
    "tension" DOUBLE PRECISION NOT NULL,
    "corriente" DOUBLE PRECISION NOT NULL,
    "potencia" DOUBLE PRECISION NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mediciones_pkey" PRIMARY KEY ("id")
);
