-- CreateEnum
CREATE TYPE "frecuencia_tarea" AS ENUM ('diaria', 'semanal', 'mensual', 'puntual');

-- CreateTable
CREATE TABLE "tarea" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo_frecuencia" "frecuencia_tarea" NOT NULL,
    "dia_semana" INTEGER,
    "dia_mes" INTEGER,
    "fecha_puntual" TIMESTAMP(3),
    "proyecto_id" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarea_completada" (
    "tarea_id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "completado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tarea_completada_pkey" PRIMARY KEY ("tarea_id","fecha")
);

-- CreateIndex
CREATE INDEX "tarea_proyecto_id_activa_idx" ON "tarea"("proyecto_id", "activa");

-- CreateIndex
CREATE INDEX "tarea_completada_fecha_idx" ON "tarea_completada"("fecha");

-- AddForeignKey
ALTER TABLE "tarea" ADD CONSTRAINT "tarea_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea_completada" ADD CONSTRAINT "tarea_completada_tarea_id_fkey" FOREIGN KEY ("tarea_id") REFERENCES "tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
