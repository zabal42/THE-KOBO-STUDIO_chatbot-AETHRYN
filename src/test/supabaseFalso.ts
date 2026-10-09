import { vi, type Mock } from "vitest";

// Mocks compartidos por los tests (nacieron en KOBO-02, en
// src/app/api/chat/route.test.ts). Solo para tests: nada de la app lo importa.

export interface ResultadoConsulta {
  data: unknown;
  error: { message: string } | null;
}

const METODOS_ENCADENABLES = ["select", "eq", "order", "limit", "insert"];
const METODOS_FINALES = ["maybeSingle", "single", "returns", "upsert"];

/**
 * Cliente de Supabase falso: cualquier cadena de consulta
 * (from().select().eq()...) termina en el resultado configurado para esa
 * tabla, o en { data: null, error: null } si no se configura ninguno.
 * `consultas[tabla]` guarda los mocks de la última consulta a cada tabla,
 * para comprobar con qué argumentos se llamó (p. ej. `upsert`).
 */
export function crearSupabaseFalso(
  resultados: Record<string, ResultadoConsulta> = {},
) {
  const consultas: Record<string, Record<string, Mock>> = {};

  const from = vi.fn((tabla: string) => {
    const resultado = resultados[tabla] ?? { data: null, error: null };
    const consulta: Record<string, Mock> = {};
    for (const metodo of METODOS_ENCADENABLES) {
      consulta[metodo] = vi.fn(() => consulta);
    }
    for (const metodo of METODOS_FINALES) {
      consulta[metodo] = vi.fn(async () => resultado);
    }
    consultas[tabla] = consulta;
    return consulta;
  });

  return { from, consultas };
}
