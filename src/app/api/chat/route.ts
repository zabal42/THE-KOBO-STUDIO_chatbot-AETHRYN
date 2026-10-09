import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import {
  buscarBotActivoPorId,
  buscarOCrearConversacion,
  construirMensajesParaOpenAI,
  guardarMensaje,
} from "@/lib/bot";

// Límites básicos contra abuso y coste descontrolado (auditoría §4.3).
// No sustituyen a un rate limit real: esto es para demo local / piloto.
const MAX_LONGITUD_MENSAJE = 2000;
const MODELO = process.env.OPENAI_MODEL ?? "gpt-4o";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { mensaje, bot_id, session_id } = (cuerpo ?? {}) as Record<
    string,
    unknown
  >;

  if (
    typeof mensaje !== "string" ||
    typeof bot_id !== "string" ||
    typeof session_id !== "string" ||
    !mensaje.trim()
  ) {
    return NextResponse.json(
      { error: "Faltan campos requeridos: mensaje, bot_id, session_id" },
      { status: 400 },
    );
  }

  if (mensaje.length > MAX_LONGITUD_MENSAJE) {
    return NextResponse.json(
      { error: `El mensaje supera ${MAX_LONGITUD_MENSAJE} caracteres` },
      { status: 413 },
    );
  }

  if (!UUID.test(bot_id) || !UUID.test(session_id)) {
    return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });
  }

  const bot = await buscarBotActivoPorId(bot_id);

  if (!bot) {
    return NextResponse.json({ error: "Bot no encontrado" }, { status: 404 });
  }

  const conversacion = await buscarOCrearConversacion(bot_id, "web", session_id);

  const messages = await construirMensajesParaOpenAI(
    bot,
    conversacion.id,
    mensaje,
  );

  await guardarMensaje(conversacion.id, "user", mensaje);

  const completion = await openai.chat.completions.create({
    model: MODELO,
    messages,
    stream: true,
    max_tokens: 800,
  });

  const encoder = new TextEncoder();
  let respuestaCompleta = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          const contenido = chunk.choices[0]?.delta?.content ?? "";
          if (contenido) {
            respuestaCompleta += contenido;
            controller.enqueue(encoder.encode(contenido));
          }
        }
      } catch (error) {
        console.error("Error en el stream de OpenAI:", error);
      } finally {
        controller.close();

        if (respuestaCompleta) {
          await guardarMensaje(conversacion.id, "assistant", respuestaCompleta);
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
