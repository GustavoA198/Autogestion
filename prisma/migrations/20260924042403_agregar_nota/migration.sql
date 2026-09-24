-- CreateTable
CREATE TABLE "nota" (
    "id" TEXT NOT NULL,
    "proyecto_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "texto" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nota_proyecto_id_fecha_idx" ON "nota"("proyecto_id", "fecha");

-- AddForeignKey
ALTER TABLE "nota" ADD CONSTRAINT "nota_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
