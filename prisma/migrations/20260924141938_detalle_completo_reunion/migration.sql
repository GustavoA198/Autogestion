-- AlterTable
ALTER TABLE "reunion" ADD COLUMN     "dia_completo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enlace_evento" TEXT,
ADD COLUMN     "estado" TEXT,
ADD COLUMN     "invitados" JSONB,
ADD COLUMN     "organizador" TEXT,
ADD COLUMN     "ubicacion" TEXT;
