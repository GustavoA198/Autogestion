-- CreateTable
CREATE TABLE "contacto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT,
    "empresa_o_cargo" TEXT,
    "nota" TEXT,
    "global" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacto_proyecto" (
    "contacto_id" TEXT NOT NULL,
    "proyecto_id" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacto_proyecto_pkey" PRIMARY KEY ("contacto_id","proyecto_id")
);

-- CreateIndex
CREATE INDEX "contacto_nombre_idx" ON "contacto"("nombre");

-- CreateIndex
CREATE INDEX "contacto_proyecto_proyecto_id_idx" ON "contacto_proyecto"("proyecto_id");

-- AddForeignKey
ALTER TABLE "contacto_proyecto" ADD CONSTRAINT "contacto_proyecto_contacto_id_fkey" FOREIGN KEY ("contacto_id") REFERENCES "contacto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacto_proyecto" ADD CONSTRAINT "contacto_proyecto_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
