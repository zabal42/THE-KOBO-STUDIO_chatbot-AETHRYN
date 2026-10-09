import { describe, expect, it, vi } from "vitest";
import type { Bot, Conocimiento } from "@/types";

// construirSystemPrompt es pura, pero bot.ts importa el cliente de Supabase
// a nivel de módulo. Se mockea para que el test no dependa de variables de
// entorno ni de red.
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => {
    throw new Error("Supabase no debe llamarse en estos tests");
  }),
}));

import { construirSystemPrompt } from "@/lib/bot";

const INSTRUCCION_FINAL =
  "Responde de forma clara, concisa y amable, basándote únicamente en la información anterior. Si no sabes la respuesta, dilo honestamente y no inventes datos.";

function crearBot(cambios: Partial<Bot> = {}): Bot {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    nombre: "Kobo",
    empresa: "The Kobo Studio",
    descripcion: "Habla de tú y sé breve.",
    color_primario: "#000000",
    logo_url: null,
    activo: true,
    whatsapp_numero: null,
    genera_ficha_oportunidad: false,
    created_at: "2026-01-01T00:00:00Z",
    ...cambios,
  };
}

function crearConocimiento(
  contenido: string,
  titulo: string | null,
): Conocimiento {
  return {
    id: "00000000-0000-4000-8000-0000000000aa",
    bot_id: "00000000-0000-4000-8000-000000000001",
    titulo,
    contenido,
    activo: true,
    created_at: "2026-01-01T00:00:00Z",
  };
}

describe("construirSystemPrompt", () => {
  it("con nombre: presenta al asistente con la empresa y el nombre", () => {
    const prompt = construirSystemPrompt(crearBot(), []);

    expect(prompt.split("\n\n")[0]).toBe(
      'Eres el asistente virtual de "The Kobo Studio" y te llamas Kobo.',
    );
  });

  it("sin nombre: presenta al asistente solo con la empresa", () => {
    const prompt = construirSystemPrompt(crearBot({ nombre: "" }), []);

    expect(prompt.split("\n\n")[0]).toBe(
      'Eres el asistente virtual de "The Kobo Studio".',
    );
    expect(prompt).not.toContain("te llamas");
  });

  it("con descripción: incluye las instrucciones de comportamiento", () => {
    const prompt = construirSystemPrompt(crearBot(), []);

    expect(prompt).toContain(
      "Instrucciones de comportamiento:\nHabla de tú y sé breve.",
    );
  });

  it("con descripción nula: omite el bloque de instrucciones", () => {
    const prompt = construirSystemPrompt(crearBot({ descripcion: null }), []);

    expect(prompt).not.toContain("Instrucciones de comportamiento");
    expect(prompt).toBe(
      `Eres el asistente virtual de "The Kobo Studio" y te llamas Kobo.\n\n${INSTRUCCION_FINAL}`,
    );
  });

  it("conocimiento con título: antepone el título al contenido", () => {
    const prompt = construirSystemPrompt(crearBot(), [
      crearConocimiento("Abrimos de 9 a 18.", "Horario"),
    ]);

    expect(prompt).toContain("Base de conocimiento:\nHorario:\nAbrimos de 9 a 18.");
  });

  it("conocimiento sin título: usa solo el contenido", () => {
    const prompt = construirSystemPrompt(crearBot(), [
      crearConocimiento("Abrimos de 9 a 18.", null),
    ]);

    expect(prompt).toContain("Base de conocimiento:\nAbrimos de 9 a 18.");
    expect(prompt).not.toContain("null");
  });

  it("varias entradas de conocimiento: se separan con una línea en blanco", () => {
    const prompt = construirSystemPrompt(crearBot(), [
      crearConocimiento("Abrimos de 9 a 18.", "Horario"),
      crearConocimiento("Estamos en Bilbao.", null),
    ]);

    expect(prompt).toContain(
      "Base de conocimiento:\nHorario:\nAbrimos de 9 a 18.\n\nEstamos en Bilbao.",
    );
  });

  it("conocimiento vacío: no aparece la base de conocimiento", () => {
    const prompt = construirSystemPrompt(crearBot(), []);

    expect(prompt).not.toContain("Base de conocimiento");
  });

  it("la instrucción de no inventar datos va siempre al final", () => {
    const casos = [
      construirSystemPrompt(crearBot(), []),
      construirSystemPrompt(crearBot({ nombre: "", descripcion: null }), []),
      construirSystemPrompt(crearBot(), [
        crearConocimiento("Abrimos de 9 a 18.", "Horario"),
      ]),
    ];

    for (const prompt of casos) {
      expect(prompt.endsWith(INSTRUCCION_FINAL)).toBe(true);
    }
  });
});
