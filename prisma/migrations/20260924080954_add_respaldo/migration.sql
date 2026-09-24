-- CreateEnum
CREATE TYPE "EstadoRespaldo" AS ENUM ('completado', 'fallido');

-- CreateTable
CREATE TABLE "respaldo" (
    "id" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nombre_archivo" TEXT NOT NULL,
    "drive_file_id" TEXT,
    "tamano_bytes" INTEGER,
    "estado" "EstadoRespaldo" NOT NULL,
    "mensaje_error" TEXT,

    CONSTRAINT "respaldo_pkey" PRIMARY KEY ("id")
);
