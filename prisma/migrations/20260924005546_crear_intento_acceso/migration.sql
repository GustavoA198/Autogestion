-- CreateTable
CREATE TABLE "intento_acceso" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intento_acceso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "intento_acceso_clave_creado_en_idx" ON "intento_acceso"("clave", "creado_en");
