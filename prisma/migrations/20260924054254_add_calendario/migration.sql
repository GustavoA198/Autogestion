-- CreateEnum
CREATE TYPE "proveedor_calendario" AS ENUM ('google', 'microsoft');

-- CreateTable
CREATE TABLE "cuenta_calendario" (
    "id" TEXT NOT NULL,
    "proveedor" "proveedor_calendario" NOT NULL,
    "usuario_id" TEXT NOT NULL DEFAULT 'unico',
    "access_token_cifrado" TEXT,
    "refresh_token_cifrado" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "sync_token" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuenta_calendario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reunion" (
    "id" TEXT NOT NULL,
    "proveedor" "proveedor_calendario" NOT NULL,
    "id_externo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "enlace_reunion" TEXT,
    "cuenta_calendario_id" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reunion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cuenta_calendario_proveedor_usuario_id_key" ON "cuenta_calendario"("proveedor", "usuario_id");

-- CreateIndex
CREATE INDEX "reunion_cuenta_calendario_id_inicio_idx" ON "reunion"("cuenta_calendario_id", "inicio");

-- CreateIndex
CREATE UNIQUE INDEX "reunion_proveedor_id_externo_key" ON "reunion"("proveedor", "id_externo");

-- AddForeignKey
ALTER TABLE "reunion" ADD CONSTRAINT "reunion_cuenta_calendario_id_fkey" FOREIGN KEY ("cuenta_calendario_id") REFERENCES "cuenta_calendario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
