import Link from "next/link";
import { notFound } from "next/navigation";
import { GenerarFichaButton } from "@/components/admin/GenerarFichaButton";
import { getConversacion, getMensajes } from "@/lib/conversaciones";
import { getFichaOportunidad } from "@/lib/fichaOportunidad";
import type { FichaOportunidadGuardada } from "@/types";

function formatearHora(fecha: string) {
  return new Date(fecha).toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function CampoFicha({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string | null;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {etiqueta}
      </dt>
      <dd className="mt-1 text-sm text-gray-900">
        {valor ?? (
          <span className="italic text-gray-400">
            No aparece en la conversación
          </span>
        )}
      </dd>
    </div>
  );
}

function FichaOportunidadSeccion({
  conversacionId,
  ficha,
}: {
  conversacionId: string;
  ficha: FichaOportunidadGuardada | null;
}) {
  const contacto = ficha?.contacto
    ? [ficha.contacto.nombre, ficha.contacto.email, ficha.contacto.telefono]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Ficha de oportunidad
          </h2>
          <p className="text-xs text-gray-500">
            {ficha
              ? `Generada el ${formatearHora(ficha.generada_at)}`
              : "Todavía no se ha generado la ficha de esta conversación."}
          </p>
        </div>
        <GenerarFichaButton
          conversacionId={conversacionId}
          yaExiste={Boolean(ficha)}
        />
      </div>

      {ficha && (
        <dl className="grid gap-4 sm:grid-cols-2">
          <CampoFicha etiqueta="Problema" valor={ficha.problema} />
          <CampoFicha etiqueta="Sector" valor={ficha.sector} />
          <CampoFicha
            etiqueta="Integraciones"
            valor={ficha.integraciones?.join(", ") ?? null}
          />
          <CampoFicha etiqueta="Plazo" valor={ficha.plazo} />
          <CampoFicha etiqueta="Contacto" valor={contacto} />
        </dl>
      )}
    </section>
  );
}

export default async function ConversacionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const conversacion = await getConversacion(id);

  if (!conversacion) {
    notFound();
  }

  // La sección solo existe si el bot tiene la ficha activada. Es cosmético:
  // la server action lo vuelve a comprobar en servidor.
  const fichaActivada = conversacion.bots?.genera_ficha_oportunidad === true;

  const [mensajes, ficha] = await Promise.all([
    getMensajes(id),
    fichaActivada ? getFichaOportunidad(id) : null,
  ]);

  return (
    <div>
      <nav className="mb-2 text-sm text-gray-500">
        <Link href="/admin/conversaciones" className="hover:text-gray-900">
          Conversaciones
        </Link>
        <span className="mx-2">→</span>
        <span className="text-gray-900">{conversacion.identificador}</span>
      </nav>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {conversacion.bots?.nombre ?? "Bot"}
          </h1>
          <p className="text-sm text-gray-500">{conversacion.identificador}</p>
        </div>
        <Link
          href="/admin/conversaciones"
          className="text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          ← Volver
        </Link>
      </div>

      {fichaActivada && (
        <FichaOportunidadSeccion conversacionId={id} ficha={ficha} />
      )}

      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-6">
        {mensajes.map((mensaje) => (
          <div
            key={mensaje.id}
            className={`flex ${
              mensaje.rol === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                mensaje.rol === "user"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <p>{mensaje.contenido}</p>
              <p
                className={`mt-1 text-xs ${
                  mensaje.rol === "user" ? "text-white/60" : "text-gray-400"
                }`}
              >
                {formatearHora(mensaje.created_at)}
              </p>
            </div>
          </div>
        ))}
        {mensajes.length === 0 && (
          <p className="text-center text-gray-400">
            Esta conversación no tiene mensajes.
          </p>
        )}
      </div>
    </div>
  );
}
