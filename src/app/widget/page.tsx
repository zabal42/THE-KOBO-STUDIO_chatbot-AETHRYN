import Link from "next/link";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Bot } from "@/types";

// Sala de demos: lista los bots activos y monta el widget del elegido
// (?bot=ID). Sirve para enseñar que el mismo motor cambia de identidad
// y conocimiento sin tocar código.
export const dynamic = "force-dynamic";

const BOT_ID_DEMO = process.env.NEXT_PUBLIC_DEMO_BOT_ID;

type BotDemo = Pick<Bot, "id" | "nombre" | "empresa" | "color_primario" | "logo_url">;

export default async function WidgetPage({
  searchParams,
}: {
  searchParams: Promise<{ bot?: string }>;
}) {
  const { bot: botParam } = await searchParams;
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("bots")
    .select("id, nombre, empresa, color_primario, logo_url")
    .eq("activo", true)
    .order("created_at", { ascending: true })
    .returns<BotDemo[]>();

  const bots = data ?? [];
  const botId = botParam ?? BOT_ID_DEMO ?? bots[0]?.id;
  const bot = bots.find((b) => b.id === botId);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-2xl font-semibold">Sala de demos</h1>
      <p className="max-w-md text-sm text-gray-500">
        Mismo motor, distinta configuración. Elige un asistente y ábrelo con la
        burbuja de la esquina inferior derecha.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        {bots.map((b) => (
          <Link
            key={b.id}
            href={`/widget?bot=${b.id}`}
            className="rounded-full border px-4 py-2 text-sm transition hover:bg-black/5"
            style={{
              borderColor: b.color_primario,
              fontWeight: b.id === botId ? 600 : 400,
            }}
          >
            {b.nombre} · {b.empresa}
          </Link>
        ))}
      </div>

      {bot ? (
        <ChatWidget
          key={bot.id}
          botId={bot.id}
          botNombre={bot.nombre}
          colorPrimario={bot.color_primario}
          logoUrl={bot.logo_url}
        />
      ) : (
        <p className="text-sm text-red-500">
          No hay bots activos. Ejecuta supabase/seed-demo.sql o crea uno en /admin.
        </p>
      )}
    </div>
  );
}
