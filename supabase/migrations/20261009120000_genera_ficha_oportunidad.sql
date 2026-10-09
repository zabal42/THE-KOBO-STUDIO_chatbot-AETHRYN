-- KOBO-04 — Ficha de oportunidad del lead
-- Para bases YA creadas con una versión anterior de schema.sql. En una
-- instalación nueva no hace falta: schema.sql ya incluye estos cambios.
-- Idempotente: se puede relanzar.
-- Después, relanzar seed-demo.sql para activar la ficha en Kobo.

-- 1. Activación por bot. Por defecto desactivada: ningún bot genera fichas
--    (ni gasta en OpenAI) hasta que se active explícitamente.
alter table public.bots
  add column if not exists genera_ficha_oportunidad boolean not null default false;

-- 2. Fichas de oportunidad, 1:1 con conversaciones. Cada campo puede ser
--    null: si la conversación no lo dice, no se inventa.
create table if not exists public.fichas_oportunidad (
  id                 uuid primary key default gen_random_uuid(),
  conversacion_id    uuid not null unique references public.conversaciones(id) on delete cascade,
  problema           text,
  sector             text,
  integraciones      text[],
  plazo              text,
  contacto_nombre    text,
  contacto_email     text,
  contacto_telefono  text,
  generada_at        timestamptz not null default now(),
  created_at         timestamptz not null default now()
);

alter table public.fichas_oportunidad enable row level security;

-- Como conversaciones y mensajes: lectura para el panel. La escritura la hace
-- la server action con la service role.
drop policy if exists "fichas_oportunidad_authenticated_select"
  on public.fichas_oportunidad;

create policy "fichas_oportunidad_authenticated_select"
  on public.fichas_oportunidad
  for select
  to authenticated
  using (true);
