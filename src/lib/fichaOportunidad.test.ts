import { describe, expect, it, vi } from "vitest";

// Mismo patrón que KOBO-02: Supabase y OpenAI se mockean en su frontera, así
// que la suite no necesita .env.local, claves ni red.
const { createAdminClient, crearCompletion } = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  crearCompletion: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));
vi.mock("@/lib/openai", () => ({
  openai: { chat: { completions: { create: crearCompletion } } },
}));

import {
  confirmarContacto,
  fichaAFila,
  generarFichaOportunidad,
  validarFicha,
} from "@/lib/fichaOportunidad";
import type { FichaOportunidad } from "@/types";

function fichaCompleta(cambios: Record<string, unknown> = {}) {
  return {
    problema: "Gestionar citas y pacientes de una clínica",
    sector: "Fisioterapia",
    integraciones: ["Google Calendar"],
    plazo: "Antes del verano",
    contacto: {
      nombre: "Ana Pérez",
      email: "ana@ejemplo.com",
      telefono: null,
    },
    ...cambios,
  };
}

function respuestaOpenAI(contenido: string | null, refusal: string | null = null) {
  return { choices: [{ message: { content: contenido, refusal } }] };
}

describe("validarFicha", () => {
  it("acepta una ficha completa y bien tipada", () => {
    const resultado = validarFicha(fichaCompleta());

    expect(resultado).toEqual({ ok: true, ficha: fichaCompleta() });
  });

  it("acepta todos los campos a null", () => {
    const resultado = validarFicha({
      problema: null,
      sector: null,
      integraciones: null,
      plazo: null,
      contacto: null,
    });

    expect(resultado.ok).toBe(true);
  });

  it("normaliza textos vacíos, listas vacías y contacto vacío a null", () => {
    const resultado = validarFicha(
      fichaCompleta({
        sector: "   ",
        integraciones: ["  ", ""],
        contacto: { nombre: "", email: null, telefono: " " },
      }),
    );

    expect(resultado).toMatchObject({
      ok: true,
      ficha: { sector: null, integraciones: null, contacto: null },
    });
  });

  it.each(["problema", "sector", "integraciones", "plazo", "contacto"])(
    "rechaza la ficha si falta %s (JSON incompleto)",
    (campo) => {
      const ficha: Record<string, unknown> = fichaCompleta();
      delete ficha[campo];

      expect(validarFicha(ficha)).toEqual({
        ok: false,
        motivo: `falta el campo ${campo}`,
      });
    },
  );

  it("rechaza contacto sin alguno de sus campos", () => {
    const resultado = validarFicha(
      fichaCompleta({ contacto: { nombre: "Ana", email: null } }),
    );

    expect(resultado).toEqual({
      ok: false,
      motivo: "falta el campo contacto.telefono",
    });
  });

  it.each([
    ["sector numérico", { sector: 42 }],
    ["problema como objeto", { problema: { texto: "x" } }],
    ["integraciones como texto", { integraciones: "Holded" }],
    ["integraciones con un número", { integraciones: ["Holded", 3] }],
    ["contacto como texto", { contacto: "ana@ejemplo.com" }],
    ["contacto como lista", { contacto: ["Ana"] }],
    [
      "email numérico",
      { contacto: { nombre: null, email: 123, telefono: null } },
    ],
  ])("rechaza tipos erróneos: %s", (_descripcion, cambios) => {
    expect(validarFicha(fichaCompleta(cambios)).ok).toBe(false);
  });

  it.each([
    ["null", null],
    ["texto", "ficha"],
    ["lista", [fichaCompleta()]],
  ])("rechaza algo que no es un objeto: %s", (_descripcion, valor) => {
    expect(validarFicha(valor)).toEqual({
      ok: false,
      motivo: "la ficha no es un objeto",
    });
  });
});

describe("confirmarContacto", () => {
  const ficha = fichaCompleta({
    contacto: {
      nombre: "Ana Pérez",
      email: "ana@ejemplo.com",
      telefono: "600 11 22 33",
    },
  }) as FichaOportunidad;

  it("mantiene email y teléfono que el usuario escribió", () => {
    const resultado = confirmarContacto(
      ficha,
      "Soy Ana Pérez, ANA@ejemplo.com, teléfono 600-112-233",
    );

    expect(resultado.contacto).toEqual(ficha.contacto);
  });

  it("descarta email y teléfono que no aparecen en lo que dijo el usuario", () => {
    const resultado = confirmarContacto(ficha, "Soy Ana Pérez");

    expect(resultado.contacto).toEqual({
      nombre: "Ana Pérez",
      email: null,
      telefono: null,
    });
  });

  it("si no queda ningún dato, contacto es null", () => {
    const sinNombre = {
      ...ficha,
      contacto: { nombre: null, email: "otro@ejemplo.com", telefono: null },
    };

    expect(confirmarContacto(sinNombre, "Hola").contacto).toBeNull();
  });
});

describe("generarFichaOportunidad", () => {
  const conversacion = [
    { rol: "user" as const, contenido: "Tengo una clínica de fisioterapia." },
    { rol: "assistant" as const, contenido: "¿Cómo te llamas y tu email?" },
    { rol: "user" as const, contenido: "Ana Pérez, ana@ejemplo.com" },
  ];

  it("pide salida estructurada estricta y devuelve la ficha validada", async () => {
    crearCompletion.mockResolvedValue(
      respuestaOpenAI(JSON.stringify(fichaCompleta())),
    );

    const ficha = await generarFichaOportunidad(conversacion);

    expect(ficha).toEqual(fichaCompleta());
    const peticion = crearCompletion.mock.calls[0][0];
    expect(peticion.response_format).toMatchObject({
      type: "json_schema",
      json_schema: { name: "ficha_oportunidad", strict: true },
    });
    expect(peticion.messages[1].content).toContain(
      "Usuario: Tengo una clínica de fisioterapia.",
    );
    expect(peticion.messages[1].content).toContain(
      "Asistente: ¿Cómo te llamas y tu email?",
    );
  });

  it("descarta un email que el usuario no dio", async () => {
    crearCompletion.mockResolvedValue(
      respuestaOpenAI(
        JSON.stringify(
          fichaCompleta({
            contacto: {
              nombre: "Ana Pérez",
              email: "inventado@ejemplo.com",
              telefono: null,
            },
          }),
        ),
      ),
    );

    const ficha = await generarFichaOportunidad(conversacion);

    expect(ficha.contacto).toEqual({
      nombre: "Ana Pérez",
      email: null,
      telefono: null,
    });
  });

  it("lanza error si la ficha no cumple el esquema", async () => {
    crearCompletion.mockResolvedValue(
      respuestaOpenAI(JSON.stringify({ problema: "Algo" })),
    );

    await expect(generarFichaOportunidad(conversacion)).rejects.toThrow(
      "Ficha inválida: falta el campo sector",
    );
  });

  it("lanza error si el JSON está mal formado", async () => {
    crearCompletion.mockResolvedValue(respuestaOpenAI("{no es json"));

    await expect(generarFichaOportunidad(conversacion)).rejects.toThrow(
      "JSON mal formado",
    );
  });

  it("lanza error si el modelo se niega", async () => {
    crearCompletion.mockResolvedValue(respuestaOpenAI(null, "No puedo."));

    await expect(generarFichaOportunidad(conversacion)).rejects.toThrow(
      "se ha negado",
    );
  });

  it("propaga el fallo de la llamada a OpenAI", async () => {
    crearCompletion.mockRejectedValue(new Error("503 Service Unavailable"));

    await expect(generarFichaOportunidad(conversacion)).rejects.toThrow(
      "503",
    );
  });
});

describe("fichaAFila", () => {
  it("aplana el contacto en columnas y deja null lo que falta", () => {
    const fila = fichaAFila(
      "c0000000-0000-4000-8000-000000000001",
      fichaCompleta({ contacto: null }) as FichaOportunidad,
      "2026-10-09T10:00:00.000Z",
    );

    expect(fila).toEqual({
      conversacion_id: "c0000000-0000-4000-8000-000000000001",
      problema: "Gestionar citas y pacientes de una clínica",
      sector: "Fisioterapia",
      integraciones: ["Google Calendar"],
      plazo: "Antes del verano",
      contacto_nombre: null,
      contacto_email: null,
      contacto_telefono: null,
      generada_at: "2026-10-09T10:00:00.000Z",
    });
  });
});
