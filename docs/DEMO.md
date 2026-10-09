# Demo local de Kobo Assistant

Objetivo: enseñar a Manu e Iñigo que existe un producto real, que el mismo
motor sirve para Kobo y para Bea, y hacia dónde va (Harness).

> **Dónde:** en un ordenador personal. Nunca en un equipo corporativo.
> **Con qué:** un proyecto Supabase NUEVO de Kobo y una clave de OpenAI de Kobo.
> Nada de Ekin: ni base de datos, ni claves, ni conversaciones.

## 1. Preparación (una vez, ~20 min)

1. **Supabase.** Crear un proyecto nuevo (plan gratuito vale).
   - SQL Editor → ejecutar `supabase/schema.sql`.
   - SQL Editor → ejecutar `supabase/seed-demo.sql`.
   - Authentication → Users → crear un usuario (email + contraseña) para entrar al panel.
2. **OpenAI.** Crear una clave de API para Kobo y ponerle un límite de gasto bajo.
3. **Variables.** `cp .env.example .env.local` y rellenar:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_DEMO_BOT_ID=6b0b0000-0000-4000-8000-000000000001`
4. `npm install`

## 2. Arrancar (cada vez)

Dos terminales:

```bash
# Terminal 1 — backend del asistente
cd repo && npm run dev                    # http://localhost:3000

# Terminal 2 — web de Manu
cd Web && python3 -m http.server 5500     # http://localhost:5500
```

Comprobaciones rápidas:
- http://localhost:5500 → aparece la burbuja del chat abajo a la derecha.
- http://localhost:3000/widget → sala de demos con los dos asistentes.
- http://localhost:3000/admin → panel (usuario creado en Supabase).

## 3. Guion (≈10 min)

**Acto 1 — Kobo en la web de Manu** (localhost:5500)
- "Hola, tengo una clínica de fisioterapia y quiero una app para gestionar citas y pacientes."
- Dejar que haga preguntas. Dar un nombre y email ficticios.
- Abrir `/admin/conversaciones` y enseñar la conversación guardada.

**Acto 2 — El mismo motor como Bea** (localhost:3000/widget → botón Bea)
- "Estoy de 20 semanas y me han dicho que me harán la ecografía morfológica, ¿qué es?"
- "Me agobia no saber qué preguntar a la matrona."
- Prueba de límites: "Desde ayer noto que el bebé se mueve menos." → debe derivar YA a matrona/urgencias.
- Abrir `/admin/bots` → editar Bea: enseñar que es configuración, no código.

**Acto 3 — Hacia dónde vamos** (pizarra, sin código)
- Un motor → muchas configuraciones (Kobo, Bea, peluquería, restaurante…).
- El Harness como fábrica: ficha del cliente → configuración + conocimiento + pruebas.
- Bea doula v0 es la primera piedra de la catedral.

## 4. Qué decir de los límites (con honestidad)

- Es una demo local con datos ficticios. No está en internet.
- El contenido de Bea es general y no está validado por profesionales: la
  versión real se valida con matronas y requiere tratar datos de salud
  (RGPD, art. 9) con las garantías adecuadas.
- Pendiente antes de un piloto público: rate limiting real, política de
  privacidad y consentimiento, auth del panel por roles, tests y observabilidad.
- Origen del código: Zorion Chat, desarrollado con Pedro. Pendiente el
  acuerdo escrito de reutilización.

## 5. Si algo falla

| Síntoma | Causa probable |
| --- | --- |
| No sale la burbuja en la web | El backend no está en :3000, o el id de `?bot=` no existe |
| La burbuja sale pero no responde | `OPENAI_API_KEY` vacía o sin saldo |
| "Bot no encontrado" | No se ejecutó `seed-demo.sql` |
| No puedo entrar a /admin | Falta crear el usuario en Supabase → Authentication |
