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

Para todas las tareas de código rige la Definition of Done de `CLAUDE.md`:
`npm run lint` y `npm run build` pasan.

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

## KOBO-03 — Rate limit simple en memoria para /api/chat y /api/tts

- **Objetivo:** limitar peticiones por IP y por `session_id` en `/api/chat` y
  `/api/tts`, devolviendo `429` cuando se supera el límite.
- **Razón:** cada petición cuesta dinero en OpenAI. `DEMO.md` ya lista el rate
  limiting como pendiente antes de un piloto público.
- **Alcance:**
  - Un módulo pequeño (p. ej. `src/lib/rateLimit.ts`) de ventana fija o
    deslizante, configurable por límite y ventana.
  - Aplicarlo en `/api/chat` (clave IP y clave `session_id`) y en `/api/tts`.
  - Respuesta `429` con mensaje en español y cabecera `Retry-After`.
  - Tests con Vitest (temporizadores falsos): por debajo del límite pasa,
    al superarlo `429`, tras la ventana vuelve a pasar; IP y `session_id`
    cuentan por separado.
  - Documentar en `docs/` (o en el propio módulo) que **un limitador en
    memoria no sirve con varias instancias ni en serverless**: cada instancia
    tiene su propio contador y se reinicia en cada despliegue. Para producción
    hace falta un almacén compartido (Redis/Upstash, tabla en Postgres…).
- **Decisiones abiertas (antes de implementar):**
  - `/api/tts` **no recibe hoy `session_id`**: el widget solo envía `{ texto }`
    (`src/components/chat/ChatWidget.tsx`). Limitar por sesión en TTS obliga a
    cambiar el cliente para enviarlo. Alternativa: en TTS, solo por IP.
  - La IP sale de `x-forwarded-for`, que el cliente puede falsificar si no hay
    un proxy de confianza delante. Aceptable en demo; documentarlo.
  - `CLAUDE.md` prohíbe guardar estado por cliente en variables de módulo.
    Los contadores de rate limit no son configuración de cliente, pero sí son
    estado de módulo: decidir si la clave incluye `bot_id` para que un tenant
    no agote el cupo de otro, y dejar escrita la excepción.
- **Qué NO tocar:** la lógica de validación existente de `/api/chat` (sigue
  igual y se ejecuta antes o después del limitador según se decida, pero no
  se reescribe); Supabase; dependencias externas de rate limit (nada de
  Redis en esta tarea).
- **Salida esperada:** módulo de rate limit, dos rutas que lo usan, tests,
  nota de limitaciones.
- **Ficheros / sistemas:** `src/lib/` (nuevo), `src/app/api/chat/route.ts`,
  `src/app/api/tts/route.ts`, tests; `ChatWidget.tsx` solo si se decide
  enviar `session_id` a TTS.
- **Criterio de hecho:**
  - `npm test` pasa e incluye los casos de rate limit de ambas rutas.
  - Con `npm run dev`, un bucle de peticiones a `/api/chat` por encima del
    límite recibe `429` (comprobable con `curl` en bucle).
  - La limitación multiinstancia está escrita en el repo.
  - `npm run lint` y `npm run build` pasan.
- **Condición de parada:** si se decide que hace falta almacén compartido ya,
  es otra tarea (cambia arquitectura y coste).
- **Dependencias:** KOBO-02 (Vitest y mocks).
- **Riesgos y controles:** limitar demasiado rompe la demo en directo → límites
  por variable de entorno con valores por defecto holgados.
- **Nivel de decisión:** `LEVEL_2_RECOMMENDED` (por las decisiones abiertas).

---

## KOBO-04 — Ficha de oportunidad del lead

- **Objetivo:** a partir de una conversación del bot de Kobo, generar un
  resumen estructurado del lead (problema, sector, integraciones, plazo,
  contacto si lo dio) y mostrarlo en `/admin/conversaciones/[id]`.
- **Razón:** convertir conversaciones en oportunidades comerciales legibles
  sin leer el chat entero. Es el primer paso hacia la "ficha del cliente" del
  Harness.
- **Alcance:**
  - Esquema fijo de la ficha: `problema`, `sector`, `integraciones` (lista),
    `plazo`, `contacto` (nombre/email/teléfono) — cada campo puede ser `null`.
  - Generación con OpenAI usando salida estructurada (JSON con esquema) y
    **validación en código** del resultado antes de guardarlo.
  - Persistencia en una tabla nueva (p. ej. `fichas_oportunidad`, 1:1 con
    `conversaciones`) con RLS como el resto del esquema.
  - Sección "Ficha de oportunidad" en la página de detalle de la conversación.
- **Decisiones abiertas (antes de implementar):**
  - **Qué es "el final de una conversación".** El chat web no tiene evento de
    cierre. Propuesta: generar la ficha **bajo demanda** desde el panel
    (botón "Generar / regenerar ficha"); alternativa: por inactividad, que
    requiere cron, retirado a propósito del proyecto.
  - **Qué bot es "el de Kobo".** No se puede fijar por id en el código (regla
    multi-tenant). Propuesta: una columna por bot (p. ej. `genera_ficha
    boolean`) editable en `/admin/bots`.
  - **Datos personales.** El contacto es dato personal: decidir retención y
    mencionarlo en la política de privacidad pendiente.
- **Qué NO tocar:** el flujo de `/api/chat` (la ficha no se genera en la ruta
  pública ni alarga la respuesta al usuario); el bot de Bea; ninguna
  integración externa (CRM, email, WhatsApp). La ficha no dispara ningún
  efecto secundario.
- **Regla de producto aplicable:** "nunca afirmar lo que no se ha obtenido".
  Si el usuario no dio contacto, el campo queda `null`, nunca se inventa.
  Si la llamada a OpenAI falla, la página lo dice ("no se ha podido generar la
  ficha"), no muestra una ficha vacía como si fuera real.
- **Salida esperada:** migración SQL, función de generación + validación,
  sección en la página de detalle.
- **Ficheros / sistemas:** `supabase/schema.sql` (o migración), `src/lib/`
  (nuevo), `src/types/index.ts`,
  `src/app/admin/(dashboard)/conversaciones/[id]/page.tsx`, posiblemente
  `BotForm.tsx` y `src/lib/actions/bots.ts` si se añade la columna por bot.
- **Criterio de hecho:**
  - Con la demo (`seed-demo.sql`), tras el guion del Acto 1 de `DEMO.md`, la
    página de la conversación muestra una ficha con problema y sector
    rellenos y el contacto ficticio dado.
  - Una conversación en la que no se da contacto muestra `contacto` vacío.
  - Tests (Vitest) de la validación: JSON incompleto o con tipos erróneos se
    rechaza; OpenAI mockeado.
  - Fallo simulado de OpenAI → mensaje explícito en la página.
  - `npm run lint` y `npm run build` pasan.
- **Condición de parada:** si se elige generación automática por inactividad
  (reintroduce cron), escalar: `CLAUDE.md` exige tarea explícita.
- **Dependencias:** KOBO-02. Recomendable después de KOBO-05.
- **Riesgos y controles:** coste por generación → solo bajo demanda y solo en
  bots con la opción activa.
- **Nivel de decisión:** `LEVEL_2_RECOMMENDED`.

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
    la *service role key*, que **se salta RLS**. Por tanto **cambiar solo las
    políticas RLS no basta**: la comprobación de rol tiene que estar en el
    código de cada acción.
  - En `supabase/schema.sql`, las políticas `bots_authenticated_all` y
    `conocimiento_authenticated_all` dan acceso total a cualquier
    `authenticated`.
- **Alcance:**
  - Fuente del rol: tabla `perfiles` (`user_id`, `rol`) o `app_metadata` de
    Supabase Auth (no `user_metadata`, que el propio usuario puede editar).
  - Helper de servidor `exigirAdmin()` que obtiene el usuario de la sesión y
    comprueba el rol; llamado al principio de cada acción de crear, editar y
    borrar bots y conocimiento.
  - Ocultar en la UI los botones de crear/editar/borrar a quien no es admin
    (solo cosmético: la seguridad está en el servidor).
  - Endurecer las políticas RLS de `bots` y `conocimiento` para que escribir
    exija rol admin (defensa en profundidad).
- **Qué NO tocar:** las rutas públicas (`/api/chat`, `/api/tts`, `/widget`,
  `/widget-embed`, `/widget.js`), que siguen funcionando sin login; las
  conversaciones (fuera de alcance salvo decisión expresa); el flujo de login.
- **Salida esperada:** migración SQL, helper de autorización, acciones
  protegidas, UI condicionada.
- **Ficheros / sistemas:** `supabase/schema.sql` (o migración),
  `src/lib/actions/bots.ts`, `src/lib/actions/conocimiento.ts`, `src/lib/`
  (helper), páginas y componentes de `src/app/admin/(dashboard)/bots/` y
  `src/components/admin/`.
- **Criterio de hecho:**
  - Con un usuario sin rol admin: invocar crear/editar/borrar bot o
    conocimiento devuelve error de autorización y la tabla no cambia
    (comprobable en Supabase).
  - Con un usuario admin: las mismas operaciones funcionan como hoy.
  - Tests (Vitest) del helper y de al menos una acción por tabla con la sesión
    mockeada: sin sesión, sin rol admin y con rol admin.
  - `npm run lint` y `npm run build` pasan.
- **Condición de parada:** si el modelo de roles necesita más de dos niveles o
  roles por bot (multi-tenant real con varios clientes en el mismo panel),
  replanificar: es otra arquitectura.
- **Dependencias:** KOBO-02.
- **Riesgos y controles:** quedarse sin ningún admin tras la migración → la
  migración asigna el rol al usuario de demo de forma explícita y documentada
  en `DEMO.md`.
- **Nivel de decisión:** `LEVEL_2_RECOMMENDED` (fuente del rol).

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
