// Pagina de respaldo y restauracion de la base de datos
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TituloSeccion } from "@/componentes/shell/titulo-seccion";
import { EstadoVacio } from "@/componentes/estado-vacio";
import { Boton } from "@/componentes/boton";
import { Modal } from "@/componentes/modal";
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

export default function RespaldoPagina() {
  const [driveEstado, setDriveEstado] = useState<{
    conectado: boolean;
    mensaje?: string;
  }>({ conectado: false });
  const [respaldos, setRespaldos] = useState<Respaldo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [modalRestaurarAbierto, setModalRestaurarAbierto] = useState(false);
  const [archivoRestore, setArchivoRestore] = useState<File | null>(null);

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

  async function handleGenerarRespaldo() {
    setGenerando(true);
    setMensaje(null);
    const resultado = await generarRespaldo();
    if (resultado.ok) {
      setMensaje({ tipo: "ok", texto: "Respaldo generado y subido a Drive correctamente." });
      const lista = await obtenerRespaldos();
      setRespaldos(lista);
    } else {
      setMensaje({ tipo: "error", texto: resultado.mensaje ?? "Error al generar respaldo." });
    }
    setGenerando(false);
  }

  async function handleRestaurar() {
    if (!archivoRestore) return;
    setModalRestaurarAbierto(false);
    setGenerando(true);
    setMensaje(null);
    const buffer = Buffer.from(await archivoRestore.arrayBuffer());
    const resultado = await restaurarRespaldo(buffer);
    if (resultado.ok) {
      setMensaje({ tipo: "ok", texto: "Restauracion completada correctamente." });
    } else {
      setMensaje({
        tipo: "error",
        texto: resultado.mensaje ?? "Error al restaurar respaldo.",
      });
    }
    setGenerando(false);
    setArchivoRestore(null);
  }

  const ultimoRespaldo = respaldos.find((r) => r.estado === "COMPLETADO");
  const diasSinRespaldo = ultimoRespaldo ? diasDesde(ultimoRespaldo.fechaCreacion) : null;
  const avisoAntiguo = diasSinRespaldo !== null && diasSinRespaldo > 7;

  if (cargando) {
    return (
      <>
        <TituloSeccion modulo="Sistema" titulo="Respaldo" />
        <div className="flex h-40 items-center justify-center">
          <span className="loading loading-spinner loading-lg" />
        </div>
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

      <div className="space-y-6">
        {/* Estado de Drive */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title text-sm">Google Drive</h2>
            {driveEstado.conectado ? (
              <div className="text-success flex items-center gap-2">
                <span className="badge badge-success badge-sm">Conectado</span>
                <span className="text-sm">Drive disponible para respaldos</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-warning flex items-center gap-2">
                  <span className="badge badge-warning badge-sm">No conectado</span>
                  <span className="text-sm">
                    Drive no conectado. Conecta tu cuenta de Google en la seccion Calendario.
                  </span>
                </div>
                <p className="text-base-content/60 text-sm">
                  Para usar respaldos automaticos necesitas conectar Google Drive. Visita la seccion
                  Calendario para conectar tu cuenta. Al reconnectar, asegúrate de otorgar el
                  permiso &quot;Gestionar archivos de Google Drive&quot; (drive.file).
                </p>
                <Link href="/calendario" className="btn btn-primary btn-sm">
                  Ir a Calendario
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title text-sm">Acciones</h2>
            <div className="flex flex-wrap gap-3">
              <Boton
                onClick={handleGenerarRespaldo}
                disabled={!driveEstado.conectado || generando}
                cargando={generando}
              >
                {generando ? "Generando..." : "Generar respaldo ahora"}
              </Boton>
              <Boton
                onClick={() => setModalRestaurarAbierto(true)}
                variante="secundario"
                disabled={generando}
              >
                Restaurar desde archivo
              </Boton>
            </div>

            {/* Mensaje de resultado */}
            {mensaje && (
              <div className={`alert ${mensaje.tipo === "ok" ? "alert-success" : "alert-error"}`}>
                <span>{mensaje.texto}</span>
              </div>
            )}
          </div>
        </div>

        {/* Aviso si hace mucho tiempo */}
        {avisoAntiguo && (
          <div className="alert alert-warning">
            <span>
              Han pasado {diasSinRespaldo} dias desde el ultimo respaldo. Es recomendable generar
              uno nuevo.
            </span>
          </div>
        )}

        {/* Historial de respaldos */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title text-sm">Ultimos respaldos</h2>
            {respaldos.length === 0 ? (
              <EstadoVacio
                titulo="Sin respaldos"
                descripcion="Genera tu primer respaldo para proteger tus datos."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="table-sm table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Nombre</th>
                      <th>Tamano</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {respaldos.map((r) => (
                      <tr key={r.id}>
                        <td className="text-sm">
                          {new Date(r.fechaCreacion).toLocaleString("es-AR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="font-mono text-sm">{r.nombreArchivo}</td>
                        <td className="text-sm">
                          {r.tamanoBytes ? formatoBytes(r.tamanoBytes) : "-"}
                        </td>
                        <td>
                          <span
                            className={`badge badge-sm ${
                              r.estado === "COMPLETADO" ? "badge-success" : "badge-error"
                            }`}
                          >
                            {r.estado === "COMPLETADO" ? "OK" : "Fallido"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de restauracion */}
      <Modal
        abierto={modalRestaurarAbierto}
        alCerrar={() => setModalRestaurarAbierto(false)}
        titulo="Restaurar respaldo"
      >
        <div className="space-y-4">
          <p className="text-sm">
            Selecciona un archivo de respaldo (.sql o .sql.gz) para restaurar la base de datos. Esta
            accion sobrescribe los datos actuales.
          </p>
          <p className="text-warning text-sm font-bold">
            Esta accion sobreescribira los datos actuales. Confirma que tienes un respaldo reciente.
          </p>
          <input
            type="file"
            accept=".sql,.sql.gz"
            className="file-input file-input-bordered w-full"
            onChange={(e) => setArchivoRestore(e.target.files?.[0] ?? null)}
          />
          <div className="flex justify-end gap-2">
            <Boton variante="secundario" onClick={() => setModalRestaurarAbierto(false)}>
              Cancelar
            </Boton>
            <Boton
              onClick={handleRestaurar}
              disabled={!archivoRestore || generando}
              cargando={generando}
            >
              Restaurar
            </Boton>
          </div>
        </div>
      </Modal>
    </>
  );
}
