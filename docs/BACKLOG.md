# Backlog — Kobo Assistant

**Estado:** `DRAFT` (backlog priorizado; cada tarea se aprueba al arrancarla)
**Marco:** ShapingTheAxe `0.2.0-beta.2`
**Preparado en:** tarea KOBO-01
**Fecha:** 2026-10-09

## Orden de ejecución

Decidido por Zabal:

1. **KOBO-02** — Tests mínimos con Vitest. Es la red para todo lo demás.
2. **KOBO-04** — Ficha de oportunidad.
3. **KOBO-05** — Panel por roles.
4. **KOBO-03** — Rate limit.

KOBO-04, KOBO-05 y KOBO-03 dependen de KOBO-02 (Vitest y mocks); entre ellas
no hay dependencias técnicas, el orden es de prioridad.

## Formato

Se usa como base la plantilla `STA/templates/implementation-plan.md`, pero solo
su bloque **§4 Tasks** (objetivo, razón, salida, ficheros, verificación,
condición de parada, dependencias, riesgos, nivel de decisión). El resto de la
plantilla (arquitectura global, puerta de aprobación única, rollback) está
pensado para *un* plan `DEEP`/`CRITICAL` ya decidido, no para una lista de
tareas independientes; se rellenará cuando cada tarea se convierta en plan.

A cada tarea se le añaden dos campos que pide el backlog: **Alcance** y
**Qué NO tocar**. El **Criterio de hecho** sustituye a "Verification" y es
siempre comprobable con un comando o una acción concreta.

Para todas las tareas de código rige la Definition of Done de `CLAUDE.md`.

---

## KOBO-02 — Tests mínimos con Vitest

- **Objetivo:** instalar Vitest y cubrir con tests unitarios
  `construirSystemPrompt` (`src/lib/bot.ts`) y las validaciones de entrada de
  `POST /api/chat` (`src/app/api/chat/route.ts`).
- **Razón:** hoy no hay ningún framework de tests. Las validaciones de
  `/api/chat` son la primera barrera contra abuso y coste, y el system prompt
  es la pieza que el futuro Harness generará: ambos necesitan red antes de
  cambiar nada.
- **Alcance:**
  - Añadir `vitest` como dependencia de desarrollo y un script `"test"` en
    `package.json` (resolviendo el alias `@/` igual que `tsconfig.json`).
  - `construirSystemPrompt` es pura: casos con y sin `nombre`, con
    `descripcion` nula, conocimiento con y sin `titulo`, conocimiento vacío
    (no debe aparecer "Base de conocimiento"), y la instrucción final de
    "no inventes datos" siempre presente.
  - `/api/chat`, mockeando `@/lib/supabase/admin` (o las funciones de
    `@/lib/bot`) y `@/lib/openai`:
    - JSON inválido → `400` `"JSON inválido"`.
    - Falta `mensaje`, `bot_id` o `session_id`, o `mensaje` en blanco → `400`.
    - `bot_id` o `session_id` que no es UUID → `400` `"Identificador inválido"`.
    - Mensaje de 2001 caracteres → **`413`** (no `400`: es lo que devuelve hoy
      el código). Mensaje de exactamente 2000 caracteres → no se rechaza por
      longitud.
    - En todos los casos de rechazo, ni Supabase ni OpenAI reciben llamadas.
- **Qué NO tocar:** el comportamiento de `route.ts` y `bot.ts`. Si un test
  destapa un bug, se documenta y se abre tarea aparte; no se arregla dentro
  de KOBO-02. Nada de tests contra Supabase u OpenAI reales ni claves en el
  repo.
- **Salida esperada:** carpeta de tests (p. ej. `src/**/*.test.ts`),
  `vitest.config.ts` si hace falta, script `npm test`.
- **Ficheros / sistemas:** `package.json`, `package-lock.json`, configuración
  de Vitest, ficheros de test nuevos.
- **Criterio de hecho:**
  - `npm test` termina con código 0 y lista al menos los casos de arriba.
  - `npm test` funciona sin `.env.local` (prueba de que todo está mockeado).
  - `npm run lint` y `npm run build` pasan.
- **Condición de parada:** si el orden actual de validaciones hace imposible
  testear un caso sin cambiar `route.ts` (p. ej. longitud antes que UUID),
  parar y decidir si se cambia el código o el test.
- **Dependencias:** ninguna.
- **Riesgos y controles:** Next 16 cambia APIs respecto a versiones previas
  (ver `AGENTS.md`); construir `NextRequest` en tests según la guía de
  `node_modules/next/dist/docs/`.
- **Nivel de decisión:** `LEVEL_1_AUTONOMOUS`.

---

## KOBO-03 — Rate limit con puerto RateLimiter y adaptador en memoria

- **Objetivo:** limitar peticiones en `/api/chat` y `/api/tts`, con límite
  principal por `session_id` y secundario por IP, devolviendo `429` cuando se
  supera.
- **Razón:** cada petición cuesta dinero en OpenAI. `DEMO.md` ya lista el rate
  limiting como pendiente antes de un piloto público.
- **Diseño decidido:**
  - **Puerto `RateLimiter`.** Las rutas solo conocen una interfaz, por ejemplo
    `consumir(clave, limite, ventanaMs) → Promise<{ permitido, reintentarEnSegundos }>`.
    Es asíncrona para que un adaptador remoto (Redis/Upstash, Postgres) encaje
    sin cambiar la firma.
  - **Adaptador en memoria** como única implementación en esta tarea. Se elige
    el adaptador en un solo sitio (p. ej. `src/lib/rateLimit/index.ts`); las
    rutas no lo importan directamente.
  - **Claves con `bot_id`**, para que dos tenants nunca compartan contador:
    `<bot_id>:sesion:<session_id>` (límite principal) y `<bot_id>:ip:<ip>`
    (límite secundario, más holgado, contra quien rota `session_id`).
  - **Orden en la ruta:** parsear y validar la entrada (JSON, campos, UUID) →
    rate limit (sesión y luego IP) → buscar bot → OpenAI. Las peticiones
    inválidas se rechazan antes y no cuestan nada.
  - **`/api/tts` recibe `bot_id` y `session_id`.** El widget hoy solo envía
    `{ texto }`; pasará a enviar también `bot_id` y `session_id` (el `bot_id`
    hace falta porque forma parte de la clave). `/api/tts` valida ambos como
    UUID y protege `request.json()` igual que `/api/chat` (hoy un JSON
    inválido da `500`).
- **Alcance:**
  - Puerto `RateLimiter`, adaptador en memoria y punto único de selección.
  - Aplicarlo en `/api/chat` y `/api/tts` con las claves de arriba.
  - Cambio en el cliente: `useChatSession` expone `sessionId` y `ChatWidget`
    lo envía, junto con `botId`, en la llamada a `/api/tts`.
  - Respuesta `429` con mensaje en español y cabecera `Retry-After`.
  - Límites y ventanas configurables por variable de entorno, con valores por
    defecto holgados para no romper la demo en directo.
  - Tests con Vitest (temporizadores falsos): por debajo del límite pasa; al
    superarlo, `429`; tras la ventana vuelve a pasar; el mismo `session_id` en
    dos bots distintos lleva contadores separados; el límite por IP salta
    aunque cambie el `session_id`.
  - Documentación en el repo (en `docs/` y en el propio módulo):
    - **El adaptador en memoria no sirve con varias instancias ni en
      serverless:** cada instancia tiene su propio contador y se reinicia en
      cada despliegue. Para producción se escribe otro adaptador del puerto
      `RateLimiter` (almacén compartido) y se cambia en el punto único de
      selección, **sin tocar las rutas**.
    - **La IP de `x-forwarded-for` solo es fiable detrás de un proxy de
      confianza** que sobrescriba esa cabecera. Sin él, el cliente la puede
      falsificar; por eso la IP es el límite secundario y no el principal.
    - El adaptador en memoria guarda estado a nivel de módulo. Es una excepción
      acotada a la regla de `CLAUDE.md`: no contiene configuración ni
      credenciales de ningún cliente, y los contadores van separados por
      `bot_id`.
- **Qué NO tocar:** las validaciones existentes de `/api/chat` (se mantienen
  tal cual, el limitador va detrás); Supabase; ninguna dependencia externa de
  rate limit (nada de Redis en esta tarea); el resto del comportamiento del
  widget.
- **Salida esperada:** puerto y adaptador, dos rutas que lo usan, cliente que
  envía `bot_id` y `session_id` a TTS, tests y nota de limitaciones.
- **Ficheros / sistemas:** `src/lib/rateLimit/` (nuevo),
  `src/app/api/chat/route.ts`, `src/app/api/tts/route.ts`,
  `src/components/chat/useChatSession.ts`,
  `src/components/chat/ChatWidget.tsx`, tests, `.env.example` (límites).
- **Criterio de hecho:**
  - `npm test` pasa e incluye los casos de rate limit de ambas rutas y del
    adaptador.
  - Con `npm run dev`, un bucle de `curl` a `/api/chat` con el mismo
    `session_id` por encima del límite recibe `429` con `Retry-After`.
  - En el navegador, el botón de escuchar del widget sigue funcionando y la
    petición a `/api/tts` lleva `bot_id` y `session_id`.
  - Las rutas no importan el adaptador en memoria (comprobable con
    `grep -rn "memoria" src/app/api` o el nombre que se le dé).
  - Las tres notas de documentación están escritas en el repo.
  - Cumple la Definition of Done de `CLAUDE.md`.
- **Condición de parada:** si hace falta almacén compartido ya (despliegue con
  varias instancias), es otra tarea: un adaptador nuevo, no un cambio de rutas.
- **Dependencias:** KOBO-02 (Vitest y mocks).
- **Riesgos y controles:** limitar demasiado rompe la demo → valores por
  defecto holgados y configurables.
- **Nivel de decisión:** `LEVEL_1_AUTONOMOUS` (decisiones cerradas por Zabal).

---

## KOBO-04 — Ficha de oportunidad del lead

- **Objetivo:** a partir de una conversación de un bot que tenga la ficha
  activada (en la demo, Kobo), generar un resumen estructurado del lead
  (problema, sector, integraciones, plazo, contacto si lo dio) y mostrarlo en
  `/admin/conversaciones/[id]`.
- **Razón:** convertir conversaciones en oportunidades comerciales legibles
  sin leer el chat entero. Es el primer paso hacia la "ficha del cliente" del
  Harness.
- **Diseño decidido:**
  - **Bajo demanda.** La ficha se genera al pulsar un botón "Generar ficha"
    (o "Regenerar ficha" si ya existe) en `/admin/conversaciones/[id]`. Sin
    cron y sin detección de inactividad: el chat web no tiene evento de cierre
    y el cron se retiró a propósito del proyecto.
  - **Activación por bot** con una columna nueva en `bots`:
    `genera_ficha_oportunidad boolean not null default false`. Nada de fijar
    el id del bot de Kobo en el código (regla multi-tenant). En la demo:
    **activada en Kobo, desactivada en Bea**.
  - **El código confirma.** La server action de generar comprueba en servidor
    que el bot de la conversación tiene la columna a `true` antes de llamar a
    OpenAI; ocultar el botón en la UI es solo cosmético.
- **Alcance:**
  - **Base de datos:**
    - Migración SQL `supabase/migrations/<fecha>_genera_ficha_oportunidad.sql`
      (carpeta nueva) con
      `alter table public.bots add column if not exists genera_ficha_oportunidad boolean not null default false;`
      y la tabla de fichas (abajo), para bases ya creadas.
    - Reflejar la columna y la tabla en `supabase/schema.sql`, para que una
      instalación nueva siguiendo `DEMO.md` (schema → seed) funcione sin pasos
      extra.
    - `supabase/seed-demo.sql`: añadir `genera_ficha_oportunidad` a la lista
      de columnas y al `on conflict … do update` de ambos bots, con `true` en
      Kobo (`…0001`) y `false` en Bea (`…0002`).
    - Tabla nueva `fichas_oportunidad` (1:1 con `conversaciones`) con RLS como
      el resto del esquema.
  - **Ficha:** esquema fijo `problema`, `sector`, `integraciones` (lista),
    `plazo`, `contacto` (nombre/email/teléfono); cada campo puede ser `null`.
    Generación con OpenAI usando salida estructurada (JSON con esquema) y
    **validación en código** antes de guardar.
  - **Panel:**
    - Botón y sección "Ficha de oportunidad" en la página de detalle de la
      conversación, visibles solo si el bot tiene la ficha activada.
    - Campo "Generar ficha de oportunidad" en el formulario del bot
      (`BotForm.tsx` + `leerCamposBot` en `src/lib/actions/bots.ts`), para no
      depender del SQL Editor.
  - **Autenticación en la acción:** la server action de generar la ficha
    obtiene el usuario con `supabase.auth.getUser()` y, si no hay usuario
    autenticado, devuelve error de autorización **antes** de leer la
    conversación o llamar a OpenAI. No exige rol `admin` (eso es KOBO-05 y
    solo para bots y conocimiento), pero tampoco confía solo en que
    `src/proxy.ts` proteja `/admin/*`: la acción se defiende por sí misma.
  - Tipos actualizados en `src/types/index.ts`.
- **Qué NO tocar:** el flujo de `/api/chat` (la ficha no se genera en la ruta
  pública ni alarga la respuesta al usuario); el contenido de Bea; ninguna
  integración externa (CRM, email, WhatsApp); ningún cron. La ficha no dispara
  ningún efecto secundario fuera de guardarse.
- **Regla de producto aplicable:** "nunca afirmar lo que no se ha obtenido".
  Si el usuario no dio contacto, el campo queda `null`, nunca se inventa.
  Si la llamada a OpenAI falla, la página lo dice ("no se ha podido generar la
  ficha"), no muestra una ficha vacía como si fuera real.
- **Salida esperada:** migración SQL, `schema.sql` y `seed-demo.sql`
  actualizados, función de generación + validación, server action, botón y
  sección en la página de detalle, campo en el formulario del bot.
- **Ficheros / sistemas:** `supabase/migrations/` (nuevo),
  `supabase/schema.sql`, `supabase/seed-demo.sql`, `src/lib/` (nuevo),
  `src/lib/actions/` (acción de generar), `src/lib/actions/bots.ts`,
  `src/components/admin/BotForm.tsx`, `src/types/index.ts`,
  `src/app/admin/(dashboard)/conversaciones/[id]/page.tsx`.
- **Criterio de hecho:**
  - En un Supabase recién montado con `DEMO.md`, `select nombre,
    genera_ficha_oportunidad from bots;` devuelve `true` para Kobo y `false`
    para Bea. Relanzar `seed-demo.sql` no cambia el resultado.
  - Tras el guion del Acto 1 de `DEMO.md`, pulsar "Generar ficha" en la
    conversación de Kobo muestra una ficha con problema y sector rellenos y el
    contacto ficticio dado.
  - En una conversación de Bea no aparece el botón, y llamar a la acción
    directamente con ese id devuelve error sin llamar a OpenAI.
  - Invocar la acción sin sesión devuelve error de autorización, sin consultar
    la conversación ni llamar a OpenAI.
  - Una conversación en la que no se da contacto muestra `contacto` vacío.
  - Tests (Vitest), con OpenAI, Supabase y `getUser()` mockeados: validación
    de la ficha (JSON incompleto o con tipos erróneos se rechaza); rechazo de
    la acción sin usuario autenticado (`getUser()` sin usuario); rechazo para
    bots sin la columna activa; y generación correcta con usuario autenticado
    sin rol `admin`.
  - Fallo simulado de OpenAI → mensaje explícito en la página.
  - Cumple la Definition of Done de `CLAUDE.md`.
- **Condición de parada:** cualquier propuesta de generación automática
  (inactividad, cron, al cerrar el widget) queda fuera: tarea aparte y
  explícita, como exige `CLAUDE.md`.
- **Dependencias:** KOBO-02.
- **Riesgos y controles:**
  - Coste por generación → solo bajo demanda y solo en bots con la columna
    activa.
  - El contacto es dato personal: la ficha lo hereda de la conversación, que
    ya lo guarda. Su retención entra en la política de privacidad pendiente
    (`DEMO.md` §4); no bloquea esta tarea en la demo con datos ficticios.
- **Nivel de decisión:** `LEVEL_1_AUTONOMOUS` (decisiones cerradas por Zabal).

---

## KOBO-05 — Panel por roles

- **Objetivo:** solo los usuarios con rol `admin` pueden crear, editar o
  borrar bots y conocimiento. El resto de usuarios autenticados, como mucho,
  consulta.
- **Razón:** hoy cualquier usuario autenticado en Supabase tiene permiso total
  sobre bots y conocimiento.
- **Situación actual (comprobada en el código):**
  - `src/proxy.ts` solo comprueba que haya sesión en `/admin/*`; no mira roles.
  - Las server actions (`src/lib/actions/bots.ts`,
    `src/lib/actions/conocimiento.ts`) usan `createAdminClient()`, es decir,
    la *service role key*, que **se salta RLS**.
  - En `supabase/schema.sql`, las políticas `bots_authenticated_all` y
    `conocimiento_authenticated_all` dan acceso total a cualquier
    `authenticated`.
- **Diseño decidido:**
  - **El rol se comprueba dentro de cada server action**, no solo en RLS:
    como las acciones usan la service role, RLS no las frena. RLS se endurece
    también, pero como defensa en profundidad, no como control principal.
  - **El rol se lee de `app_metadata`** del usuario de Supabase
    (`app_metadata.rol === "admin"`), **nunca de `user_metadata`**: este
    último lo puede modificar el propio usuario desde el cliente con
    `auth.updateUser`, así que cualquiera podría darse rol admin.
    `app_metadata` solo se escribe con la service role.
  - En las acciones, el usuario se obtiene con `supabase.auth.getUser()` (lo
    valida el servidor de Auth y devuelve el `app_metadata` actual), no con
    `getSession()`, que lee la cookie sin validarla.
- **Alcance:**
  - Helper de servidor `exigirAdmin()` en `src/lib/` que obtiene el usuario
    con `getUser()` y lanza error de autorización si no hay sesión o si
    `app_metadata.rol` no es `"admin"`. Se llama **al principio** de
    `createBotAction`, `updateBotAction`, `deleteBotAction` y de las acciones
    de crear, editar y borrar de `src/lib/actions/conocimiento.ts`, antes de
    tocar la base de datos.
  - Ocultar en la UI los botones y páginas de crear/editar/borrar a quien no
    es admin (solo cosmético: la seguridad está en el servidor).
  - Migración SQL en `supabase/migrations/` (y reflejo en `schema.sql`) que
    sustituye `bots_authenticated_all` y `conocimiento_authenticated_all` por:
    lectura para `authenticated`; escritura solo si
    `(auth.jwt() -> 'app_metadata' ->> 'rol') = 'admin'`.
  - Documentar en `DEMO.md` (paso de preparación) **cómo asignar el rol desde
    el panel de Supabase**:
    1. Authentication → Users: crear el usuario (como hoy).
    2. SQL Editor → ejecutar, con el email de ese usuario:

       ```sql
       update auth.users
       set raw_app_meta_data =
         coalesce(raw_app_meta_data, '{}'::jsonb) || '{"rol": "admin"}'::jsonb
       where email = 'usuario@ejemplo.com';
       ```

    3. Comprobar con
       `select email, raw_app_meta_data from auth.users;` que aparece
       `"rol": "admin"`.
    4. Cerrar sesión en `/admin` y volver a entrar: el JWT (y por tanto RLS)
       solo lleva el rol nuevo tras renovar la sesión. Las server actions ya lo
       ven antes, porque `getUser()` consulta al servidor.

    Alternativa por código, solo desde servidor y nunca desde el navegador:
    `supabase.auth.admin.updateUserById(id, { app_metadata: { rol: "admin" } })`
    con la service role.
- **Qué NO tocar:** las rutas públicas (`/api/chat`, `/api/tts`, `/widget`,
  `/widget-embed`, `/widget.js`), que siguen funcionando sin login; las
  conversaciones y la generación de la ficha de KOBO-04 (siguen al alcance de
  cualquier usuario autenticado: no son crear, editar ni borrar bots o
  conocimiento); el flujo de login; `user_metadata`, que no se lee para nada.
- **Salida esperada:** helper de autorización, acciones protegidas, UI
  condicionada, migración RLS, instrucciones en `DEMO.md`.
- **Ficheros / sistemas:** `src/lib/` (helper), `src/lib/actions/bots.ts`,
  `src/lib/actions/conocimiento.ts`, páginas y componentes de
  `src/app/admin/(dashboard)/bots/` y `src/components/admin/`,
  `supabase/migrations/` y `supabase/schema.sql`, `docs/DEMO.md`.
- **Criterio de hecho:**
  - Con un usuario sin rol admin: invocar crear/editar/borrar bot o
    conocimiento devuelve error de autorización y la tabla no cambia
    (comprobable en Supabase).
  - Un usuario que se pone `{"rol": "admin"}` en `user_metadata` (vía
    `auth.updateUser` desde el navegador) sigue sin poder escribir.
  - Con un usuario admin asignado según `DEMO.md`: las mismas operaciones
    funcionan como hoy.
  - `grep -rn "user_metadata" src` no devuelve ninguna comprobación de rol.
  - Tests (Vitest) del helper y de al menos una acción por tabla con
    `getUser()` mockeado: sin sesión, rol solo en `user_metadata`, sin rol y
    con `app_metadata.rol = "admin"`.
  - Cumple la Definition of Done de `CLAUDE.md`.
- **Condición de parada:** si el modelo de roles necesita más de dos niveles o
  roles por bot (multi-tenant real con varios clientes en el mismo panel),
  replanificar: es otra arquitectura.
- **Dependencias:** KOBO-02. Va después de KOBO-04, así que el campo
  `genera_ficha_oportunidad` del formulario del bot queda protegido por la
  misma comprobación de `updateBotAction`.
- **Riesgos y controles:** quedarse sin ningún admin tras la migración → el
  paso de asignar el rol está en `DEMO.md` y se hace antes de aplicar la
  migración RLS.
- **Nivel de decisión:** `LEVEL_1_AUTONOMOUS` (decisiones cerradas por Zabal).

---

## Dependencias

Resultado de `npm audit` ejecutado el 2026-10-09 sobre `package-lock.json` de
`main` (`c2bbbf1`), tras `npm ci`, con npm 10.9.4 y Node 22.22.0. **No se ha
aplicado ningún arreglo.**

### `npm audit` (producción + desarrollo)

**5 vulnerabilidades de severidad alta**, todas la misma cadena y todas de
**desarrollo**:

| Paquete | Versión instalada | ¿Directo? | Tipo | Severidad |
| --- | --- | --- | --- | --- |
| `eslint-config-next` | 16.4.0 | Sí (`devDependencies`) | desarrollo | alta |
| `@next/eslint-plugin-next` | 16.4.0 | No | desarrollo | alta |
| `fast-glob` | 3.3.1 | No | desarrollo | alta |
| `micromatch` | 4.0.8 | No | desarrollo | alta |
| `braces` | 3.0.3 | No | desarrollo | alta |

Cadena: `eslint-config-next@16.4.0` → `@next/eslint-plugin-next@16.4.0` →
`fast-glob@3.3.1` → `micromatch@4.0.8` → `braces@3.0.3`.

Origen: `braces`, aviso
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
(denegación de servicio por agotamiento de pila con patrones muy anidados).
Los otros cuatro aparecen solo por depender de él.

**Arreglo que propone npm:** `npm audit fix --force`, que instalaría
`eslint-config-next@14.2.35` (cambio de versión mayor, *breaking change*).

Valoración: ese "arreglo" es un **downgrade de dos versiones mayores** de la
configuración de ESLint de Next (16 → 14) en un proyecto con Next 16; lo más
probable es que rompa `npm run lint`. No se recomienda aplicarlo. El código
vulnerable solo se ejecuta al lanzar ESLint en local o en CI, con patrones de
glob controlados por el propio proyecto, no en la app servida. Opción razonable:
esperar a una versión de `eslint-config-next` que actualice `fast-glob`, o
probar un `overrides` en `package.json` en una tarea aparte y verificar con
`npm run lint`.

### `npm audit --omit=dev` (solo producción)

`found 0 vulnerabilities`. Las dependencias de producción (`next`, `react`,
`react-dom`, `@supabase/ssr`, `@supabase/supabase-js`, `openai`, `cookie`) no
tienen avisos conocidos en esta fecha.

---

## Deuda conocida

### Panel sin aislamiento por tenant

- **Qué pasa:** el panel lee y escribe con la *service role*
  (`createAdminClient()` en `src/lib/conversaciones.ts` y en
  `src/lib/actions/`), que se salta RLS. Cualquier usuario autenticado en el
  panel ve las conversaciones de **todos** los bots. KOBO-05 solo restringe
  crear, editar y borrar bots y conocimiento; no cambia esto.
- **Por qué es aceptable hoy:** el único usuario del panel es el equipo de
  Kobo, que ya debe poder ver todos los bots.
- **Cuándo deja de serlo:** antes de dar acceso al panel a un cliente. En ese
  momento hay que aislar por tenant (Fase 3 del dossier): columna `tenant_id`,
  RLS real que filtre por tenant (sin depender de la service role en las
  lecturas del panel) y pruebas cross-tenant que demuestren que un usuario de
  un tenant no ve ni modifica datos de otro.

### Vitest fijado en la versión 4

- **Qué pasa:** Vitest 5 requiere `@types/node` 22 o superior y el proyecto
  usa `^20`. Por eso KOBO-02 fija `vitest` en `^4.1.11`, que acepta
  `@types/node` 20.
- **Cuándo resolverlo:** al subir `@types/node` a 22 o superior (tarea
  aparte), se puede pasar a Vitest 5 y verificar con `npm test`.

### npm 10 falla al instalar dependencias de desarrollo

- **Qué pasa:** con npm 10, `npm install -D vitest` falla con
  `Cannot read properties of null (reading 'edgesOut')`, un fallo interno del
  resolvedor de npm.
- **Qué hacer:** usar npm 11 o superior para instalar o actualizar
  dependencias (por ejemplo, `npx npm@11 install …`). `npm ci` con npm 10
  sigue funcionando con el `package-lock.json` resultante.

### `/admin/bots` se genera como página estática en producción

- **Qué pasa:** en `npm run build`, `/admin/bots` aparece como `○ (Static)`:
  Next la prerenderiza una sola vez, en el momento del build, así que en
  producción la lista de bots quedaría congelada con los datos de ese momento
  (o vacía, si el build se hace sin acceso a Supabase). Las acciones del panel
  llaman a `revalidatePath("/admin/bots")` y la regeneran al crear, editar o
  borrar, pero un cambio hecho por otra vía (SQL Editor, `seed-demo.sql`) no
  se vería.
- **Con `npm run dev` no afecta:** en desarrollo todas las páginas se
  renderizan en cada petición, así que la demo local no lo nota.
- **Qué hacer:** antes de desplegar en producción, forzar la página a
  dinámica (tarea aparte, siguiendo la guía de `node_modules/next/dist/docs/`)
  y comprobar en la salida de `npm run build` que pasa a `ƒ (Dynamic)`.
