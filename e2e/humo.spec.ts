import { expect, test } from "@playwright/test";

test("el endpoint de salud confirma la conexión a la base de datos sin sesión", async ({
  request,
}) => {
  const respuesta = await request.get("/api/health");
  expect(respuesta.ok()).toBe(true);
  expect(await respuesta.json()).toEqual({ estado: "ok", baseDatos: "conectada" });
});
