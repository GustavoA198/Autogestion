-- CreateEnum
CREATE TYPE "estado_tarea" AS ENUM ('nueva', 'en_desarrollo', 'pausada', 'bloqueada', 'completada', 'cancelada');

-- CreateEnum
CREATE TYPE "prioridad_tarea" AS ENUM ('baja', 'media', 'alta', 'urgente');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "tipo_notificacion" ADD VALUE 'tarea_vence_pronto';
ALTER TYPE "tipo_notificacion" ADD VALUE 'resumen_dia';

-- AlterTable
ALTER TABLE "tarea" ADD COLUMN     "asignado_por" TEXT,
ADD COLUMN     "estado" "estado_tarea" NOT NULL DEFAULT 'nueva',
ADD COLUMN     "fecha_inicio" DATE,
ADD COLUMN     "fecha_limite" DATE,
ADD COLUMN     "porcentaje" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "prioridad" "prioridad_tarea" NOT NULL DEFAULT 'media',
ADD COLUMN     "responsable" TEXT;

-- CreateTable
CREATE TABLE "tarea_enlace" (
    "id" TEXT NOT NULL,
    "tarea_id" TEXT NOT NULL,
    "etiqueta" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tarea_enlace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarea_checklist_item" (
    "id" TEXT NOT NULL,
    "tarea_id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "hecho" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tarea_checklist_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarea_comentario" (
    "id" TEXT NOT NULL,
    "tarea_id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tarea_comentario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tarea_enlace_tarea_id_orden_idx" ON "tarea_enlace"("tarea_id", "orden");

-- CreateIndex
CREATE INDEX "tarea_checklist_item_tarea_id_orden_idx" ON "tarea_checklist_item"("tarea_id", "orden");

-- CreateIndex
CREATE INDEX "tarea_comentario_tarea_id_creado_en_idx" ON "tarea_comentario"("tarea_id", "creado_en");

-- CreateIndex
CREATE INDEX "tarea_estado_idx" ON "tarea"("estado");

-- CreateIndex
CREATE INDEX "tarea_fecha_limite_idx" ON "tarea"("fecha_limite");

-- AddForeignKey
ALTER TABLE "tarea_enlace" ADD CONSTRAINT "tarea_enlace_tarea_id_fkey" FOREIGN KEY ("tarea_id") REFERENCES "tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea_checklist_item" ADD CONSTRAINT "tarea_checklist_item_tarea_id_fkey" FOREIGN KEY ("tarea_id") REFERENCES "tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea_comentario" ADD CONSTRAINT "tarea_comentario_tarea_id_fkey" FOREIGN KEY ("tarea_id") REFERENCES "tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
