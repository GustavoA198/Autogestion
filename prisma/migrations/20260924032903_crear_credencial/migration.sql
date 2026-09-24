-- CreateEnum
CREATE TYPE "categoria_credencial" AS ENUM ('base_datos', 'servidor', 'aplicacion', 'otro');

-- CreateTable
CREATE TABLE "credencial" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "categoria_credencial" NOT NULL,
    "usuario" TEXT,
    "secreto_cifrado" TEXT NOT NULL,
    "host" TEXT,
    "nota" TEXT,
    "global" BOOLEAN NOT NULL DEFAULT false,
    "secreto_actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credencial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credencial_proyecto" (
    "credencial_id" TEXT NOT NULL,
    "proyecto_id" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credencial_proyecto_pkey" PRIMARY KEY ("credencial_id","proyecto_id")
);

-- CreateTable
CREATE TABLE "historial_credencial" (
    "id" TEXT NOT NULL,
    "credencial_id" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_credencial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "credencial_categoria_idx" ON "credencial"("categoria");

-- CreateIndex
CREATE INDEX "credencial_proyecto_proyecto_id_idx" ON "credencial_proyecto"("proyecto_id");

-- CreateIndex
CREATE INDEX "historial_credencial_credencial_id_fecha_idx" ON "historial_credencial"("credencial_id", "fecha");

-- AddForeignKey
ALTER TABLE "credencial_proyecto" ADD CONSTRAINT "credencial_proyecto_credencial_id_fkey" FOREIGN KEY ("credencial_id") REFERENCES "credencial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credencial_proyecto" ADD CONSTRAINT "credencial_proyecto_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_credencial" ADD CONSTRAINT "historial_credencial_credencial_id_fkey" FOREIGN KEY ("credencial_id") REFERENCES "credencial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
