-- AlterTable: el valor por defecto rellena las filas existentes y se retira después
ALTER TABLE "nota" ADD COLUMN     "minutos" INTEGER,
ADD COLUMN     "proximo_paso" TEXT NOT NULL DEFAULT 'Sin definir';

-- Las entradas nuevas deben indicar su próximo paso
ALTER TABLE "nota" ALTER COLUMN "proximo_paso" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "nota_fecha_idx" ON "nota"("fecha");
