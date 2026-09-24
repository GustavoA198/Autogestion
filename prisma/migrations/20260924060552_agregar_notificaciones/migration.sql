-- CreateEnum
CREATE TYPE "tipo_notificacion" AS ENUM ('reunion_proxima', 'tarea_vence_hoy');

-- CreateTable
CREATE TABLE "notificacion" (
    "id" TEXT NOT NULL,
    "tipo" "tipo_notificacion" NOT NULL,
    "referencia_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "fecha_evento" TIMESTAMP(3) NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacion_descartada" (
    "notificacion_id" TEXT NOT NULL,
    "descartada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacion_descartada_pkey" PRIMARY KEY ("notificacion_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notificacion_tipo_referencia_id_fecha_evento_key" ON "notificacion"("tipo", "referencia_id", "fecha_evento");

-- AddForeignKey
ALTER TABLE "notificacion_descartada" ADD CONSTRAINT "notificacion_descartada_notificacion_id_fkey" FOREIGN KEY ("notificacion_id") REFERENCES "notificacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
