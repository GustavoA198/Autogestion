// Página de respaldo y restauración de la base de datos
"use client";

import { useState, useEffect } from "react";
import { Alerta } from "@/componentes/alerta";
import { Boton } from "@/componentes/boton";
import { BotonEnlace } from "@/componentes/enlace";
import { Casilla } from "@/componentes/casilla";
import { EstadoCarga } from "@/componentes/estado-carga";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { Icono } from "@/componentes/icono";
import { Insignia } from "@/componentes/insignia";
import { Modal } from "@/componentes/modal";
import { Tarjeta } from "@/componentes/shell/tarjeta";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { Tabla } from "@/componentes/tabla";
import {
  generarRespaldo,
  restaurarRespaldo,
  obtenerRespaldos,
  obtenerEstadoDrive,
} from "./acciones";
import type { Respaldo } from "@/generated/prisma/client";

function formatoBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function diasDesde(timestamp: Date): number {
  const ahora = Date.now();
  const fecha = new Date(timestamp).getTime();
  return Math.floor((ahora - fecha) / (1000 * 60 * 60 * 24));
}

const FORMATO_FECHA = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" });

type Operacion = "generando" | "restaurando" | null;

export default function RespaldoPagina() {
  const [driveEstado, setDriveEstado] = useState<{
    conectado: boolean;
    mensaje?: string;
  }>({ conectado: false });
  const [respaldos, setRespaldos] = useState<Respaldo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [operacion, setOperacion] = useState<Operacion>(null);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [modalRestaurarAbierto, setModalRestaurarAbierto] = useState(false);
  const [archivoRestore, setArchivoRestore] = useState<File | null>(null);
  const [entiendeRiesgo, setEntiendeRiesgo] = useState(false);

  useEffect(() => {
    Promise.all([obtenerEstadoDrive(), obtenerRespaldos()])
      .then(([estado, lista]) => {
        setDriveEstado(estado);
        setRespaldos(lista);
      })
      .catch(() => {
        setDriveEstado({ conectado: false });
      })
      .finally(() => setCargando(false));
  }, []);

  function cerrarModal() {
    setModalRestaurarAbierto(false);
    setArchivoRestore(null);
    setEntiendeRiesgo(false);
  }

  async function handleGenerarRespaldo() {
    setOperacion("generando");
    setMensaje(null);
    const resultado = await generarRespaldo();
    if (resultado.ok) {
      setMensaje({ tipo: "ok", texto: "Respaldo generado y subido a Drive correctamente." });
      const lista = await obtenerRespaldos();
      setRespaldos(lista);
    } else {
      setMensaje({ tipo: "error", texto: resultado.mensaje ?? "Error al generar respaldo." });
    }
    setOperacion(null);
  }

  async function handleRestaurar() {
    if (!archivoRestore) return;
    setOperacion("restaurando");
    setMensaje(null);
    const buffer = Buffer.from(await archivoRestore.arrayBuffer());
    const resultado = await restaurarRespaldo(buffer);
    if (resultado.ok) {
      setMensaje({ tipo: "ok", texto: "Restauración completada correctamente." });
    } else {
      setMensaje({
        tipo: "error",
        texto: resultado.mensaje ?? "Error al restaurar respaldo.",
      });
    }
    setOperacion(null);
    cerrarModal();
  }

  const ultimoRespaldo = respaldos.find((r) => r.estado === "COMPLETADO");
  const diasSinRespaldo = ultimoRespaldo ? diasDesde(ultimoRespaldo.fechaCreacion) : null;
  const avisoAntiguo = diasSinRespaldo !== null && diasSinRespaldo > 7;
  const ocupado = operacion !== null;

  if (cargando) {
    return (
      <>
        <TituloSeccion modulo="Sistema" titulo="Respaldo" />
        <EstadoCarga filas={4} etiqueta="Cargando respaldos" />
      </>
    );
  }

  return (
    <>
      <TituloSeccion
        modulo="Sistema"
        titulo="Respaldo"
        descripcion="Genera y restaura respaldos de la base de datos usando Google Drive."
      />

      <div className="space-y-5">
        {mensaje ? (
          <Alerta tono={mensaje.tipo === "ok" ? "exito" : "critico"}>{mensaje.texto}</Alerta>
        ) : null}
        {avisoAntiguo ? (
          <Alerta tono="atencion">
            Han pasado {diasSinRespaldo} días desde el último respaldo. Es recomendable generar uno
            nuevo.
          </Alerta>
        ) : null}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Tarjeta
            titulo="Google Drive"
            accion={
              <Insignia tono={driveEstado.conectado ? "success" : "warning"}>
                {driveEstado.conectado ? "Conectado" : "No conectado"}
              </Insignia>
            }
          >
            {driveEstado.conectado ? (
              <p className="text-sm">Drive está disponible para guardar tus respaldos.</p>
            ) : (
              <>
                <p className="text-sm">
                  Para generar respaldos necesitas conectar tu cuenta de Google desde la sección
                  Calendario.
                </p>
                <p className="text-suave text-sm">
                  Al reconectar, otorga el permiso &quot;Gestionar archivos de Google Drive&quot;
                  (drive.file).
                </p>
                <div>
                  <BotonEnlace href="/calendario" variante="secundario" tamano="pequeno">
                    Ir a Calendario
                  </BotonEnlace>
                </div>
              </>
            )}
          </Tarjeta>

          <Tarjeta titulo="Acciones">
            <p className="text-suave text-sm">
              El respaldo es un volcado de la base de datos que se sube a tu Drive.
            </p>
            <div className="flex flex-wrap gap-3">
              <Boton
                onClick={handleGenerarRespaldo}
                disabled={!driveEstado.conectado || ocupado}
                cargando={operacion === "generando"}
              >
                <Icono nombre="respaldo" tamano={16} />
                {operacion === "generando" ? "Generando…" : "Generar respaldo ahora"}
              </Boton>
              <Boton
                onClick={() => setModalRestaurarAbierto(true)}
                variante="secundario"
                disabled={ocupado}
                cargando={operacion === "restaurando"}
              >
                Restaurar desde archivo
              </Boton>
            </div>
          </Tarjeta>
        </div>

        {respaldos.length === 0 ? (
          <Tarjeta titulo="Últimos respaldos">
            <EstadoVacio
              icono="respaldo"
              titulo="Sin respaldos"
              descripcion="Genera tu primer respaldo para proteger tus datos."
            />
          </Tarjeta>
        ) : (
          <Tabla titulo="Últimos respaldos" aria-label="Últimos respaldos">
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Nombre</th>
                <th scope="col">Tamaño</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {respaldos.map((r) => (
                <tr key={r.id}>
                  <td data-etiqueta="Fecha" className="font-mono text-sm whitespace-nowrap">
                    {FORMATO_FECHA.format(new Date(r.fechaCreacion))}
                  </td>
                  <td data-etiqueta="Nombre" className="font-mono text-sm break-all">
                    {r.nombreArchivo}
                  </td>
                  <td data-etiqueta="Tamaño" className="font-mono text-sm">
                    {r.tamanoBytes ? formatoBytes(r.tamanoBytes) : "—"}
                  </td>
                  <td data-etiqueta="Estado">
                    <Insignia tono={r.estado === "COMPLETADO" ? "success" : "error"}>
                      {r.estado === "COMPLETADO" ? "Completado" : "Fallido"}
                    </Insignia>
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        )}
      </div>

      <Modal
        abierto={modalRestaurarAbierto}
        alCerrar={cerrarModal}
        titulo="Restaurar respaldo"
        descripcion="Selecciona un archivo de respaldo (.sql o .sql.gz)."
        pie={
          <>
            <Boton variante="fantasma" onClick={cerrarModal} disabled={ocupado}>
              Cancelar
            </Boton>
            <Boton
              variante="peligro"
              onClick={handleRestaurar}
              disabled={!archivoRestore || !entiendeRiesgo || ocupado}
              cargando={operacion === "restaurando"}
            >
              Restaurar
            </Boton>
          </>
        }
      >
        <div className="space-y-4">
          <Alerta tono="atencion">
            Esta acción sobrescribe los datos actuales. Confirma que tienes un respaldo reciente.
          </Alerta>
          <div>
            <label htmlFor="archivo-respaldo" className="mb-1.5 block text-sm font-bold">
              Archivo de respaldo
            </label>
            <input
              id="archivo-respaldo"
              type="file"
              accept=".sql,.sql.gz"
              className="file-input w-full"
              onChange={(e) => setArchivoRestore(e.target.files?.[0] ?? null)}
            />
          </div>
          <Casilla
            etiqueta="Entiendo que se reemplazarán los datos actuales"
            checked={entiendeRiesgo}
            onChange={(e) => setEntiendeRiesgo(e.target.checked)}
          />
        </div>
      </Modal>
    </>
  );
}
