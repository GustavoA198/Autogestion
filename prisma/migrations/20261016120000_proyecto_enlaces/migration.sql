-- CreateTable
CREATE TABLE "proyecto_enlace" (
    "id" TEXT NOT NULL,
    "proyecto_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "proyecto_enlace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proyecto_enlace_proyecto_id_orden_idx" ON "proyecto_enlace"("proyecto_id", "orden");

-- AddForeignKey
ALTER TABLE "proyecto_enlace" ADD CONSTRAINT "proyecto_enlace_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migra el enlace único de cada proyecto a la lista nueva con el nombre "Documentación"
INSERT INTO "proyecto_enlace" ("id", "proyecto_id", "nombre", "url", "orden")
SELECT gen_random_uuid()::text, "id", 'Documentación', trim("enlace_documentacion"), 0
FROM "proyecto"
WHERE coalesce(trim("enlace_documentacion"), '') <> '';

-- AlterTable
ALTER TABLE "proyecto" DROP COLUMN "enlace_documentacion";
