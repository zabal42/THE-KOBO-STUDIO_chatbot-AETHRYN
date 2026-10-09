import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  crearSupabaseFalso,
  type ResultadoConsulta,
} from "@/test/supabaseFalso";

// Supabase (service role y sesión), OpenAI y la caché de Next se mockean en
// su frontera, como en KOBO-02: sin .env.local, claves ni red.
const { createAdminClient, crearCompletion, getUser, revalidatePath } =
  vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    crearCompletion: vi.fn(),
    getUser: vi.fn(),
    revalidatePath: vi.fn(),
  }));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));
vi.mock("@/lib/openai", () => ({
  openai: { chat: { completions: { create: crearCompletion } } },
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));
vi.mock("next/cache", () => ({ revalidatePath }));

import { generarFichaOportunidadAction } from "@/lib/actions/fichaOportunidad";

const CONVERSACION_ID = "33333333-3333-4333-8333-333333333333";

// Usuario autenticado SIN rol admin: la ficha no exige rol (eso es KOBO-05).
const USUARIO_SIN_ROL = {
  id: "44444444-4444-4444-8444-444444444444",
  email: "equipo@ejemplo.com",
  app_metadata: { provider: "email" },
  user_metadata: {},
};

const MENSAJES = [
  {
    rol: "user",
    contenido: "Tengo una clínica de fisioterapia y quiero una app de citas.",
  },
  { rol: "assistant", contenido: "¿Con qué trabajáis ahora?" },
  { rol: "user", contenido: "Con hojas de cálculo. Soy Ana, ana@ejemplo.com" },
];

const FICHA_MODELO = {
  problema: "Gestionar citas y pacientes de su clínica",
  sector: "Fisioterapia",
  integraciones: ["Hojas de cálculo"],
  plazo: null,
  contacto: { nombre: "Ana", email: "ana@ejemplo.com", telefono: null },
};

function sesionCon(usuario: unknown, error: unknown = null) {
  getUser.mockResolvedValue({ data: { user: usuario }, error });
}

let supabase: ReturnType<typeof crearSupabaseFalso>;

/** Prepara el Supabase falso con la conversación y sus mensajes. */
function baseDeDatos(
  bot: Record<string, unknown> | null,
  extra: Record<string, ResultadoConsulta> = {},
) {
  supabase = crearSupabaseFalso({
    conversaciones: {
      data: {
        id: CONVERSACION_ID,
        bot_id: "6b0b0000-0000-4000-8000-000000000001",
        canal: "web",
        identificador: "sesion",
        created_at: "2026-10-09T10:00:00Z",
        bots: bot,
      },
      error: null,
    },
    mensajes: { data: MENSAJES, error: null },
    ...extra,
  });
  createAdminClient.mockImplementation(() => supabase);
}

function openAIDevuelve(ficha: unknown) {
  crearCompletion.mockResolvedValue({
    choices: [{ message: { content: JSON.stringify(ficha), refusal: null } }],
  });
}

function expectSinEfectos() {
  expect(crearCompletion).not.toHaveBeenCalled();
  expect(supabase.consultas.fichas_oportunidad).toBeUndefined();
  expect(revalidatePath).not.toHaveBeenCalled();
}

beforeEach(() => {
  sesionCon(USUARIO_SIN_ROL);
  baseDeDatos({ nombre: "Kōbō", genera_ficha_oportunidad: true });
  openAIDevuelve(FICHA_MODELO);
});

describe("generarFichaOportunidadAction — autenticación", () => {
  it("sin usuario autenticado → error de autorización, sin leer la conversación ni llamar a OpenAI", async () => {
    sesionCon(null);

    const resultado = await generarFichaOportunidadAction(CONVERSACION_ID);

    expect(resultado).toEqual({
      ok: false,
      error: "No autorizado: inicia sesión en el panel.",
    });
    expect(createAdminClient).not.toHaveBeenCalled();
    expectSinEfectos();
  });

  it("getUser() con error de sesión → error de autorización, sin tocar nada", async () => {
    sesionCon(null, { name: "AuthSessionMissingError" });

    const resultado = await generarFichaOportunidadAction(CONVERSACION_ID);

    expect(resultado).toMatchObject({ ok: false, error: /No autorizado/ });
    expect(createAdminClient).not.toHaveBeenCalled();
    expectSinEfectos();
  });
});

describe("generarFichaOportunidadAction — el código confirma", () => {
  it.each([
    ["false (Bea)", { nombre: "Bea", genera_ficha_oportunidad: false }],
    ["ausente (base sin migrar)", { nombre: "Bea" }],
  ])(
    "bot con la columna %s → error sin llamar a OpenAI",
    async (_descripcion, bot) => {
      baseDeDatos(bot);

      const resultado = await generarFichaOportunidadAction(CONVERSACION_ID);

      expect(resultado).toEqual({
        ok: false,
        error: "Este bot no tiene activada la ficha de oportunidad.",
      });
      expectSinEfectos();
    },
  );

  it("conversación inexistente → error sin llamar a OpenAI", async () => {
    baseDeDatos(null, { conversaciones: { data: null, error: null } });

    const resultado = await generarFichaOportunidadAction(CONVERSACION_ID);

    expect(resultado).toEqual({ ok: false, error: "Conversación no encontrada." });
    expectSinEfectos();
  });

  it("id que no es UUID → error sin consultar la base de datos", async () => {
    const resultado = await generarFichaOportunidadAction("kobo");

    expect(resultado).toEqual({
      ok: false,
      error: "Identificador de conversación inválido.",
    });
    expect(createAdminClient).not.toHaveBeenCalled();
    expectSinEfectos();
  });

  it("conversación sin mensajes del usuario → error sin llamar a OpenAI", async () => {
    baseDeDatos(
      { nombre: "Kōbō", genera_ficha_oportunidad: true },
      { mensajes: { data: [], error: null } },
    );

    const resultado = await generarFichaOportunidadAction(CONVERSACION_ID);

    expect(resultado).toMatchObject({ ok: false });
    expectSinEfectos();
  });

  it("fallo al leer la conversación → error explícito, no 'no encontrada'", async () => {
    baseDeDatos(null, {
      conversaciones: { data: null, error: { message: "timeout" } },
    });

    const resultado = await generarFichaOportunidadAction(CONVERSACION_ID);

    expect(resultado).toEqual({
      ok: false,
      error: "No se ha podido consultar la conversación.",
    });
    expectSinEfectos();
  });
});

describe("generarFichaOportunidadAction — generación", () => {
  it("usuario autenticado sin rol admin → genera, valida y guarda la ficha", async () => {
    const resultado = await generarFichaOportunidadAction(CONVERSACION_ID);

    expect(resultado).toEqual({ ok: true });
    expect(crearCompletion).toHaveBeenCalledTimes(1);
    expect(supabase.consultas.fichas_oportunidad.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        conversacion_id: CONVERSACION_ID,
        problema: "Gestionar citas y pacientes de su clínica",
        sector: "Fisioterapia",
        integraciones: ["Hojas de cálculo"],
        plazo: null,
        contacto_nombre: "Ana",
        contacto_email: "ana@ejemplo.com",
        contacto_telefono: null,
      }),
      { onConflict: "conversacion_id" },
    );
    expect(revalidatePath).toHaveBeenCalledWith(
      `/admin/conversaciones/${CONVERSACION_ID}`,
    );
  });

  it("sin contacto en la conversación → se guarda el contacto vacío aunque el modelo invente uno", async () => {
    baseDeDatos(
      { nombre: "Kōbō", genera_ficha_oportunidad: true },
      {
        mensajes: {
          data: [{ rol: "user", contenido: "Quiero una app para mi bar." }],
          error: null,
        },
      },
    );
    openAIDevuelve({
      ...FICHA_MODELO,
      contacto: { nombre: null, email: "bar@ejemplo.com", telefono: null },
    });

    const resultado = await generarFichaOportunidadAction(CONVERSACION_ID);

    expect(resultado).toEqual({ ok: true });
    expect(supabase.consultas.fichas_oportunidad.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        contacto_nombre: null,
        contacto_email: null,
        contacto_telefono: null,
      }),
      { onConflict: "conversacion_id" },
    );
  });

  it("fallo de OpenAI → mensaje explícito y no se guarda nada", async () => {
    crearCompletion.mockRejectedValue(new Error("503 Service Unavailable"));

    const resultado = await generarFichaOportunidadAction(CONVERSACION_ID);

    expect(resultado).toEqual({
      ok: false,
      error:
        "No se ha podido generar la ficha. Inténtalo de nuevo en unos minutos.",
    });
    expect(supabase.consultas.fichas_oportunidad).toBeUndefined();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("OpenAI devuelve una ficha con tipos erróneos → no se guarda", async () => {
    openAIDevuelve({ ...FICHA_MODELO, integraciones: "Holded" });

    const resultado = await generarFichaOportunidadAction(CONVERSACION_ID);

    expect(resultado).toMatchObject({ ok: false, error: /No se ha podido generar/ });
    expect(supabase.consultas.fichas_oportunidad).toBeUndefined();
  });

  it("fallo al guardar → error explícito", async () => {
    baseDeDatos(
      { nombre: "Kōbō", genera_ficha_oportunidad: true },
      { fichas_oportunidad: { data: null, error: { message: "RLS" } } },
    );

    const resultado = await generarFichaOportunidadAction(CONVERSACION_ID);

    expect(resultado).toEqual({
      ok: false,
      error: "La ficha se ha generado, pero no se ha podido guardar.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
