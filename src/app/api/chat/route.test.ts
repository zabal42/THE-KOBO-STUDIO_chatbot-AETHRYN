import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Supabase y OpenAI se mockean en su frontera: así cada test puede comprobar
// que una petición rechazada no llega a ninguno de los dos, y la suite no
// necesita .env.local, claves ni red.
const { createAdminClient, crearCompletion } = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  crearCompletion: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));
vi.mock("@/lib/openai", () => ({
  openai: { chat: { completions: { create: crearCompletion } } },
}));

import { POST } from "@/app/api/chat/route";
import { crearSupabaseFalso } from "@/test/supabaseFalso";

const BOT_ID = "11111111-1111-4111-8111-111111111111";
const SESSION_ID = "22222222-2222-4222-8222-222222222222";

function peticion(cuerpo: unknown) {
  return new NextRequest("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo),
  });
}

function cuerpoValido(cambios: Record<string, unknown> = {}) {
  return { mensaje: "Hola", bot_id: BOT_ID, session_id: SESSION_ID, ...cambios };
}

async function esperarRechazo(
  respuesta: Response,
  estado: number,
  error: string | RegExp,
) {
  expect(respuesta.status).toBe(estado);
  const json = (await respuesta.json()) as { error: string };
  if (typeof error === "string") {
    expect(json.error).toBe(error);
  } else {
    expect(json.error).toMatch(error);
  }
  expect(createAdminClient).not.toHaveBeenCalled();
  expect(crearCompletion).not.toHaveBeenCalled();
}

const FALTAN_CAMPOS = "Faltan campos requeridos: mensaje, bot_id, session_id";

// Sin resultados configurados, toda consulta devuelve { data: null }: con eso
// buscarBotActivoPorId devuelve null y la ruta responde 404.
beforeEach(() => {
  createAdminClient.mockImplementation(crearSupabaseFalso);
});

describe("POST /api/chat — validaciones de entrada", () => {
  it("JSON inválido → 400 'JSON inválido'", async () => {
    const respuesta = await POST(peticion("{esto no es json"));

    await esperarRechazo(respuesta, 400, "JSON inválido");
  });

  it("cuerpo null → 400 por campos ausentes", async () => {
    const respuesta = await POST(peticion("null"));

    await esperarRechazo(respuesta, 400, FALTAN_CAMPOS);
  });

  it.each(["mensaje", "bot_id", "session_id"])(
    "falta %s → 400",
    async (campo) => {
      const cuerpo: Record<string, unknown> = cuerpoValido();
      delete cuerpo[campo];

      const respuesta = await POST(peticion(cuerpo));

      await esperarRechazo(respuesta, 400, FALTAN_CAMPOS);
    },
  );

  it("mensaje que no es texto → 400", async () => {
    const respuesta = await POST(peticion(cuerpoValido({ mensaje: 42 })));

    await esperarRechazo(respuesta, 400, FALTAN_CAMPOS);
  });

  it.each([
    ["vacío", ""],
    ["solo espacios", "   "],
    ["solo saltos de línea y tabuladores", "\n\t\n"],
  ])("mensaje en blanco (%s) → 400", async (_descripcion, mensaje) => {
    const respuesta = await POST(peticion(cuerpoValido({ mensaje })));

    await esperarRechazo(respuesta, 400, FALTAN_CAMPOS);
  });

  it("bot_id que no es UUID → 400 'Identificador inválido'", async () => {
    const respuesta = await POST(
      peticion(cuerpoValido({ bot_id: "kobo" })),
    );

    await esperarRechazo(respuesta, 400, "Identificador inválido");
  });

  it("session_id que no es UUID → 400 'Identificador inválido'", async () => {
    const respuesta = await POST(
      peticion(cuerpoValido({ session_id: "sesion-123" })),
    );

    await esperarRechazo(respuesta, 400, "Identificador inválido");
  });

  it("mensaje de 2001 caracteres → 413", async () => {
    const respuesta = await POST(
      peticion(cuerpoValido({ mensaje: "a".repeat(2001) })),
    );

    await esperarRechazo(respuesta, 413, "El mensaje supera 2000 caracteres");
  });

  it("documenta el orden actual: la longitud se valida antes que el UUID", async () => {
    // Con un mensaje largo y un id inválido gana el 413. No es un requisito,
    // es el comportamiento de hoy: si se reordena, este test lo hará visible.
    const respuesta = await POST(
      peticion(cuerpoValido({ mensaje: "a".repeat(2001), bot_id: "kobo" })),
    );

    await esperarRechazo(respuesta, 413, "El mensaje supera 2000 caracteres");
  });

  it("mensaje de exactamente 2000 caracteres → no se rechaza por longitud", async () => {
    const respuesta = await POST(
      peticion(cuerpoValido({ mensaje: "a".repeat(2000) })),
    );

    // Pasa todas las validaciones y llega a buscar el bot. El Supabase falso
    // no lo encuentra, así que la ruta responde 404 sin llegar a OpenAI.
    expect(respuesta.status).toBe(404);
    expect(await respuesta.json()).toEqual({ error: "Bot no encontrado" });
    expect(createAdminClient).toHaveBeenCalled();
    expect(crearCompletion).not.toHaveBeenCalled();
  });
});
