// Sube archivos a Google Drive usando el OAuth de CuentaCalendario existente (HU-10/HU-15)
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { leerEntornoCalendario } from "@/lib/env";
import { descifrar } from "@/lib/cifrado/cifrado";
import { obtenerPrisma } from "@/lib/prisma";

const USUARIO_ID = "unico";
const SCOPE_DRIVE = "https://www.googleapis.com/auth/drive.file";

// Lee tokens cifrados de la cuenta Google y configura el cliente OAuth
async function configurarClienteDrive(): Promise<OAuth2Client> {
  const cuenta = await obtenerPrisma().cuentaCalendario.findUnique({
    where: { proveedor_usuarioId: { proveedor: "GOOGLE", usuarioId: USUARIO_ID } },
  });

  if (!cuenta || !cuenta.refreshTokenCifrado) {
    throw new Error("Drive no conectado. Conecta tu cuenta de Google en la seccion Calendario.");
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = leerEntornoCalendario();

  const oauth2Client = new OAuth2Client({
    clientId: GOOGLE_CLIENT_ID ?? "",
    clientSecret: GOOGLE_CLIENT_SECRET ?? "",
    redirectUri: GOOGLE_REDIRECT_URI,
  });

  const accessToken = cuenta.accessTokenCifrado ? descifrar(cuenta.accessTokenCifrado) : null;
  const refreshToken = descifrar(cuenta.refreshTokenCifrado);

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return oauth2Client;
}

// Sube un buffer a Google Drive con nombre dado en la carpeta opcional
export async function subirARive(
  datos: Buffer,
  nombreArchivo: string,
  folderId?: string,
): Promise<string> {
  const oauth2Client = await configurarClienteDrive();
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const cuerpo: Record<string, unknown> = {
    name: nombreArchivo,
    mimeType: "application/gzip",
  };

  if (folderId) {
    cuerpo.parents = [folderId];
  }

  const respuesta = await drive.files.create({
    requestBody: cuerpo,
    media: {
      mimeType: "application/gzip",
      body: datos,
    },
    fields: "id",
  });

  const fileId = respuesta.data.id;
  if (!fileId) {
    throw new Error("Drive no devolvio un fileId.");
  }

  return fileId;
}
