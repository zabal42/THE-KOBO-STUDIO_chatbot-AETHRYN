"use server";

import { revalidatePath } from "next/cache";
import { getConversacion, getMensajes } from "@/lib/conversaciones";
import {
  fichaAFila,
  generarFichaOportunidad,
  type ResultadoGenerarFicha,
} from "@/lib/fichaOportunidad";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fallo(error: string): ResultadoGenerarFicha {
  return { ok: false, error };
}

/**
 * Genera (o regenera) la ficha de oportunidad de una conversación, bajo
 * demanda. Se defiende por sí misma: no confía en que proxy.ts proteja
 * /admin/* ni en que la UI oculte el botón, porque una server action se puede
 * invocar con un POST directo.
 */
export async function generarFichaOportunidadAction(
  conversacionId: string,
): Promise<ResultadoGenerarFicha> {
  // 1. Autenticación, antes de leer nada o gastar en OpenAI. getUser() valida
  //    la sesión contra el servidor de Auth (getSession() solo lee la cookie).
  //    No exige rol admin: eso es KOBO-05 y solo para bots y conocimiento.
  const supabase = await createClient();
  const { data: sesion, error: errorAuth } = await supabase.auth.getUser();
  if (errorAuth || !sesion?.user) {
    return fallo("No autorizado: inicia sesión en el panel.");
  }

  if (!UUID.test(conversacionId)) {
    return fallo("Identificador de conversación inválido.");
  }

  // 2. El código confirma: el bot de la conversación debe tener la ficha
  //    activada. Ocultar el botón en la UI es solo cosmético.
  let conversacion;
  try {
    conversacion = await getConversacion(conversacionId);
  } catch (error) {
    console.error("Ficha de oportunidad:", error);
    return fallo("No se ha podido consultar la conversación.");
  }

  if (!conversacion) {
    return fallo("Conversación no encontrada.");
  }

  if (conversacion.bots?.genera_ficha_oportunidad !== true) {
    return fallo("Este bot no tiene activada la ficha de oportunidad.");
  }

  let mensajes;
  try {
    mensajes = await getMensajes(conversacionId);
  } catch (error) {
    console.error("Ficha de oportunidad:", error);
    return fallo("No se han podido leer los mensajes de la conversación.");
  }

  if (!mensajes.some((m) => m.rol === "user")) {
    return fallo("La conversación no tiene mensajes del usuario que resumir.");
  }

  // 3. El modelo propone; generarFichaOportunidad valida antes de devolver.
  let ficha;
  try {
    ficha = await generarFichaOportunidad(mensajes);
  } catch (error) {
    console.error("Ficha de oportunidad:", error);
    return fallo(
      "No se ha podido generar la ficha. Inténtalo de nuevo en unos minutos.",
    );
  }

  // 4. Único efecto: guardar la ficha (1:1 con la conversación).
  const { error: errorGuardado } = await createAdminClient()
    .from("fichas_oportunidad")
    .upsert(fichaAFila(conversacionId, ficha), {
      onConflict: "conversacion_id",
    });

  if (errorGuardado) {
    console.error("Ficha de oportunidad:", errorGuardado.message);
    return fallo("La ficha se ha generado, pero no se ha podido guardar.");
  }

  revalidatePath(`/admin/conversaciones/${conversacionId}`);
  return { ok: true };
}
