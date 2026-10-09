# Requisitos del producto — Kobo Assistant

**Estado:** `DRAFT` — describe el código de `main` en el commit `4928b66`
(KOBO-04 incluida).
**Preparado en:** tarea KOBO-RF.
**Fecha:** 2026-10-09.
**Para:** Manu (diseño y web) e Iñigo (desarrollo), socios de The Kobo Studio.

> **Regla de este documento:** describe lo que el sistema **hace según el
> código**, no lo que creemos que hace. Cada requisito implementado lleva su
> evidencia: un fichero con sus líneas, o el nombre de un test. Lo que no se
> puede demostrar así se marca como **no verificado** o no se afirma.
>
> Las referencias `fichero:línea` apuntan al commit indicado arriba. Si el
> código cambia, las líneas pueden moverse.

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Glosario](#2-glosario)
3. [Arquitectura](#3-arquitectura)
4. [Actores](#4-actores)
5. [Requisitos funcionales implementados](#5-requisitos-funcionales-implementados)
6. [Requisitos funcionales planificados](#6-requisitos-funcionales-planificados)
7. [Requisitos no funcionales](#7-requisitos-no-funcionales)
8. [Los dos bots de demostración](#8-los-dos-bots-de-demostración)
9. [Qué NO hace hoy](#9-qué-no-hace-hoy)
10. [Verificación manual](#10-verificación-manual)
11. [Deuda conocida y hoja de ruta](#11-deuda-conocida-y-hoja-de-ruta)

---

## 1. Resumen ejecutivo

**Qué es.** Kobo Assistant es el motor de asistentes conversacionales de The
Kobo Studio. Es **un solo programa** (Next.js + Supabase + OpenAI) que puede
hacer de muchos asistentes distintos: cada asistente ("bot") es una fila en la
base de datos con su nombre, su empresa, sus instrucciones de comportamiento y
su base de conocimiento. Cambiar de asistente es cambiar datos, no código.
Deriva de Zorion Chat; en esta versión se quitaron a propósito AimHarder,
WhatsApp/Twilio y el cron.

**Qué hace hoy (demostrable en el código):**

- Se instala en cualquier web con **una línea** `<script>` que pinta una
  burbuja de chat abajo a la derecha.
- Responde **en streaming** (el texto aparece mientras se genera) usando
  OpenAI, con las instrucciones y el conocimiento del bot elegido y los
  últimos 20 mensajes de la conversación.
- **Guarda** cada conversación y cada mensaje en Supabase.
- Lee en voz alta las respuestas (**texto a voz**).
- Tiene una **sala de demos** para cambiar de bot con un clic.
- Tiene un **panel** con login para crear y editar bots y su conocimiento,
  leer las conversaciones y, en los bots que lo tengan activado, generar una
  **ficha de oportunidad** (resumen comercial del lead) bajo demanda.

**Para quién, hoy:** para el equipo de Kobo, como **demo local** con datos
ficticios. No está preparado para estar abierto en internet (ver
[§9](#9-qué-no-hace-hoy)).

**Tres líneas de futuro:**

1. **Bea Care — doula IA para Bebeplanet.** Un acompañante para embarazadas.
   Hoy existe como *Bea doula v0*, una configuración de demostración con
   contenido general **no validado por profesionales**. La versión real exige
   validar el contenido con matronas y tratar datos de salud (categoría
   especial del art. 9 del RGPD) con las garantías adecuadas.
2. **Asistentes para pymes.** El mismo motor, configurado para una clínica,
   una peluquería o un restaurante: identidad, instrucciones y conocimiento
   del negocio. Requiere antes cerrar la deuda de seguridad y multi-tenant.
3. **El Harness como fábrica de asistentes.** A partir de una "ficha del
   cliente", generar la configuración, el conocimiento y las pruebas de un
   bot nuevo. La pieza que el Harness tendría que producir ya está aislada:
   `construirSystemPrompt` en `src/lib/bot.ts:91-108`. Hoy el Harness **no
   existe en el código**; es una línea de producto.

---

## 2. Glosario

| Término | Qué significa en este proyecto |
| --- | --- |
| **Bot** | Un asistente concreto (Kobo, Bea…). Es una fila de la tabla `bots` (`supabase/schema.sql:9-21`). |
| **Configuración de bot** | Todo lo que define a un bot: nombre, empresa, instrucciones, color, logo, si está activo y si genera ficha de oportunidad. Vive en la tabla `bots` y se edita desde el panel. |
| **Instrucciones** | El texto que dice al modelo cómo comportarse (tono, qué hace y qué no). Se guarda en la columna `bots.descripcion` y en el panel aparece como "Descripción / instrucciones del sistema" (`src/components/admin/BotForm.tsx:70-89`). |
| **Conocimiento** | Fragmentos de texto (título opcional + contenido) que el bot puede usar para responder. Tabla `conocimiento` (`supabase/schema.sql:85-92`). Solo se usan los que están `activo = true`. |
| **Conversación** | Un hilo de chat entre un visitante y un bot. Tabla `conversaciones`; se identifica por bot + canal + identificador de sesión (`src/lib/bot.ts:26-56`). |
| **Sesión** | Dos cosas distintas, ojo: (a) **sesión de chat**: un UUID que el navegador genera al cargar el widget (`src/components/chat/useChatSession.ts:12`) y que agrupa los mensajes de una conversación; (b) **sesión del panel**: el login de Supabase Auth, guardado en cookies que se borran al cerrar el navegador (`src/lib/supabase/cookies.ts:8-13`). |
| **Widget** | La burbuja de chat. Es el componente `ChatWidget` (`src/components/chat/ChatWidget.tsx`), que se monta dentro de un iframe en webs ajenas o directamente en la sala de demos. |
| **Sala de demos** | La página `/widget`: lista los bots activos y deja elegir uno (`src/app/widget/page.tsx`). |
| **Panel** | La zona `/admin`, con login, para gestionar bots, conocimiento y conversaciones. |
| **Ficha de oportunidad** | Resumen estructurado de un lead (problema, sector, integraciones, plazo, contacto) generado bajo demanda desde una conversación. Tabla `fichas_oportunidad` (`supabase/schema.sql:107-119`). Tarea KOBO-04. |
| **Tenant** | Un cliente del producto (por ejemplo, una pyme con su bot). "Multi-tenant" significa que varios clientes comparten el mismo motor sin ver los datos de los demás. Hoy no hay columna de tenant: ver [§9](#9-qué-no-hace-hoy). |
| **Service role** | La clave de Supabase con permisos totales, que **se salta RLS**. Solo existe en servidor (`SUPABASE_SERVICE_ROLE_KEY`, `src/lib/supabase/admin.ts:3-14`). Casi todo el código de servidor la usa. |
| **RLS** | *Row Level Security*: reglas de Postgres que dicen qué filas puede leer o escribir cada tipo de usuario. Están activadas en todas las tablas (`supabase/schema.sql`), pero no frenan a la service role. |
| **Server action** | Función de servidor de Next.js que el navegador invoca como si fuera local (marcada con `"use server"`). Aquí: crear/editar/borrar bots y conocimiento y generar la ficha (`src/lib/actions/`). Se pueden invocar con un POST directo, por eso deben defenderse solas. |
| **Puerto y adaptador** | Patrón de diseño: el código habla con una interfaz propia (**puerto**) y detrás hay una o varias implementaciones intercambiables (**adaptadores**). Hoy **no hay ninguno** en el código; está planificado para el rate limit (KOBO-03) y el modelo de lenguaje (KOBO-06). |
| **Seed** | Script que carga datos iniciales. Aquí `supabase/seed-demo.sql`, que crea los bots Kobo y Bea con su conocimiento. Es idempotente: se puede relanzar. |
| **Migración** | Script SQL que cambia una base ya creada para ponerla al día. Carpeta `supabase/migrations/`; hoy hay una (`20261009120000_genera_ficha_oportunidad.sql`). Una instalación nueva no la necesita porque `schema.sql` ya está al día. |

---

## 3. Arquitectura

### 3.1 Piezas

| Pieza | Qué es | Dónde |
| --- | --- | --- |
| Web cliente | Cualquier web que pegue el `<script>`. En la demo, la web de Kobo en `web/`, servida con `npm run web` en el puerto 5500. | `web/index.html:633` |
| Cargador | JavaScript que crea el iframe del widget. | `src/app/widget.js/route.ts` |
| Widget embebido | Página que pinta solo la burbuja, con fondo transparente. | `src/app/widget-embed/page.tsx` |
| API de chat | Recibe el mensaje, valida, consulta Supabase, llama a OpenAI y devuelve el texto en streaming. | `src/app/api/chat/route.ts` |
| API de voz | Convierte un texto en MP3. | `src/app/api/tts/route.ts` |
| Panel | Páginas de `/admin` y server actions. | `src/app/admin/`, `src/lib/actions/` |
| Supabase | Postgres (datos) + Auth (login del panel). | `supabase/schema.sql` |
| OpenAI | Chat (`gpt-4o` por defecto, `OPENAI_MODEL` lo cambia), ficha (mismo modelo) y voz (`tts-1`). | `src/lib/openai.ts`, `src/app/api/chat/route.ts:13`, `src/lib/fichaOportunidad.ts:14`, `src/app/api/tts/route.ts:14-19` |

### 3.2 Recorrido de un mensaje

```mermaid
sequenceDiagram
    autonumber
    actor V as Visitante
    participant W as Web cliente<br/>(p. ej. web/index.html)
    participant L as /widget.js<br/>(cargador)
    participant I as iframe /widget-embed<br/>(ChatWidget)
    participant A as POST /api/chat
    participant S as Supabase<br/>(service role)
    participant O as OpenAI

    W->>L: <script src=".../widget.js?bot=ID">
    L->>W: crea iframe → /widget-embed?bot=ID
    I->>S: lee nombre, color y logo del bot
    V->>I: escribe un mensaje
    I->>A: { mensaje, bot_id, session_id }
    A->>A: valida JSON, campos, longitud (≤ 2000) y UUID
    A->>S: bot activo por id
    A->>S: busca o crea la conversación (bot + "web" + session_id)
    A->>S: últimos 20 mensajes + conocimiento activo
    A->>S: guarda el mensaje del usuario
    A->>O: chat.completions (stream, max_tokens 800)
    loop por cada fragmento
        O-->>A: fragmento de texto
        A-->>I: fragmento (text/plain en streaming)
    end
    A->>S: al cerrar el stream, guarda la respuesta completa
    I-->>V: respuesta pintada en la burbuja
```

Evidencia del orden: `src/app/api/chat/route.ts:16-102`;
cargador: `src/app/widget.js/route.ts:5-45`; lectura del bot en el iframe:
`src/app/widget-embed/page.tsx:19-25`.

### 3.3 Modelo de datos

```mermaid
erDiagram
    bots ||--o{ conversaciones : "bot_id (on delete cascade)"
    bots ||--o{ conocimiento : "bot_id (on delete cascade)"
    conversaciones ||--o{ mensajes : "conversacion_id (on delete cascade)"
    conversaciones ||--o| fichas_oportunidad : "conversacion_id único (on delete cascade)"

    bots {
        uuid id PK
        text nombre
        text empresa
        text descripcion "instrucciones"
        text color_primario
        text logo_url
        boolean activo
        text whatsapp_numero "heredado, sin uso"
        boolean genera_ficha_oportunidad
        timestamptz created_at
    }
    conversaciones {
        uuid id PK
        uuid bot_id FK
        text canal "web | whatsapp"
        text identificador "session_id del widget"
        timestamptz created_at
    }
    mensajes {
        uuid id PK
        uuid conversacion_id FK
        text rol "user | assistant"
        text contenido
        timestamptz created_at
    }
    conocimiento {
        uuid id PK
        uuid bot_id FK
        text titulo
        text contenido
        boolean activo
        timestamptz created_at
    }
    fichas_oportunidad {
        uuid id PK
        uuid conversacion_id FK "unique"
        text problema
        text sector
        text_array integraciones
        text plazo
        text contacto_nombre
        text contacto_email
        text contacto_telefono
        timestamptz generada_at
        timestamptz created_at
    }
```

Evidencia: `supabase/schema.sql:9-135`. Borrar un bot borra en cascada sus
conversaciones, mensajes, fichas y conocimiento.

### 3.4 Por qué un mismo motor sirve a varios bots

Porque **todo lo que identifica a un bot vive en datos, no en código**:

- El widget recibe el bot por parámetro (`?bot=ID`) y lee su nombre, color y
  logo de la base de datos (`src/app/widget-embed/page.tsx:19-35`).
- La API de chat carga el bot por su id (`src/app/api/chat/route.ts:52`), su
  conocimiento activo y su historial (`src/lib/bot.ts:110-125`).
- El *system prompt* se construye **solo** con la configuración de ese bot y su
  conocimiento; no hay texto global por cliente
  (`src/lib/bot.ts:86-108`; tests en `src/lib/bot.test.ts`, bloque
  `construirSystemPrompt`).
- Funciones opcionales, como la ficha de oportunidad, se activan con una
  columna del bot (`genera_ficha_oportunidad`), no comparando ids en el código
  (`src/lib/actions/fichaOportunidad.ts:55-57`).

Comprobación hecha para este documento: `grep -rn "6b0b0000" src` solo
encuentra el id de Kobo como dato de prueba en
`src/lib/actions/fichaOportunidad.test.ts:70`; ningún fichero de código de la
aplicación lo contiene. Fuera de `src/`, los ids de Kobo y Bea aparecen en
`supabase/seed-demo.sql`, `web/index.html` y la documentación.

Un bot nuevo = una fila en `bots` + filas en `conocimiento`. Esa es la base del
Harness: generar esas filas a partir de la ficha de un cliente.

---

## 4. Actores

| Actor | Estado | Qué puede hacer | Cómo se le reconoce |
| --- | --- | --- | --- |
| **Visitante de la web** | Implementado | Abrir la burbuja, chatear con un bot activo, escuchar respuestas en voz alta. | No se identifica. Solo lleva un `session_id` aleatorio generado en su navegador (`src/components/chat/useChatSession.ts:12`). |
| **Usuario del panel** | Implementado | Todo el panel: crear, editar y borrar bots y conocimiento; ver todas las conversaciones de todos los bots; generar fichas. | Usuario con email y contraseña en Supabase Auth (`src/app/admin/login/page.tsx:19-23`). Hoy **todos los usuarios del panel tienen los mismos permisos**: no hay roles. |
| **Administrador por rol** | Futuro (KOBO-05) | Solo él podrá crear, editar o borrar bots y conocimiento. | `app_metadata.rol === "admin"` en Supabase, comprobado dentro de cada server action. |
| **Cliente con su propio panel** | Futuro (deuda multi-tenant) | Ver y gestionar solo sus bots y sus conversaciones. | Requiere columna `tenant_id`, RLS por tenant y pruebas cross-tenant. Ver `docs/BACKLOG.md`, "Panel sin aislamiento por tenant". |

---

## 5. Requisitos funcionales implementados

Cada ficha dice **cómo está verificada**:

- **Test**: hay un test automático (Vitest) que lo demuestra. Los tests se
  ejecutan con `npm test`, con Supabase y OpenAI simulados.
- **Código**: se ha comprobado leyendo el código en las líneas citadas, pero
  ningún test lo ejecuta. Es lo que el código dice que hace; no se ha probado
  en un navegador para este documento.

Para KOBO-RF se ejecutó `npm test` el 2026-10-09 sobre `main` (`4928b66`):
**4 ficheros, 65 tests, todos pasan**.

### Chat y widget

#### RF-01 — Widget embebible con una línea

- **Actor:** visitante de la web (y quien instala el widget en su web).
- **Descripción:** pegar
  `<script src="https://<servidor>/widget.js?bot=<id>" defer></script>` en
  cualquier web crea un iframe fijo abajo a la derecha que carga
  `/widget-embed?bot=<id>`. El iframe mide 70×70 px cerrado y 420×620 px
  abierto: el widget avisa al cargador con `postMessage` y el cargador solo
  acepta mensajes de su propio iframe. Las cabeceras permiten cargar el script
  desde cualquier origen y meter el iframe en cualquier web.
- **Criterio de aceptación:** en una web con esa línea aparece la burbuja; al
  pulsarla se abre el chat; sin `?bot=` no se crea nada.
- **Evidencia (código):** cargador `src/app/widget.js/route.ts:5-45`
  (sin bot no hace nada: línea 10; filtro de origen del mensaje: línea 23);
  aviso de tamaño `src/components/chat/ChatWidget.tsx:106-114`; tamaños
  `src/components/chat/ChatWidget.tsx:67-68`; cabeceras
  `next.config.ts:4-18`; uso real en `web/index.html:633`.

#### RF-02 — Chat con respuesta en streaming

- **Actor:** visitante.
- **Descripción:** `POST /api/chat` llama a OpenAI con `stream: true` y
  `max_tokens: 800` y reenvía cada fragmento al navegador como texto plano.
  El widget pinta los fragmentos según llegan y muestra "escribiendo..."
  hasta el primero. Modelo: `OPENAI_MODEL` o, si no está, `gpt-4o`.
- **Criterio de aceptación:** la respuesta aparece poco a poco, no de golpe.
- **Evidencia (código):** `src/app/api/chat/route.ts:68-102`;
  modelo `src/app/api/chat/route.ts:13`; cliente
  `src/components/chat/useChatSession.ts:49-75`; indicador
  `src/components/chat/ChatWidget.tsx:304-310`.

#### RF-03 — Identidad e instrucciones por bot

- **Actor:** visitante (lo percibe), usuario del panel (lo configura).
- **Descripción:** el *system prompt* empieza por "Eres el asistente virtual
  de "<empresa>" y te llamas <nombre>", añade las instrucciones del bot
  (`descripcion`) si las hay, y termina siempre con la orden de basarse solo
  en esa información y no inventar datos.
- **Criterio de aceptación:** dos bots con distinta configuración reciben
  prompts distintos; sin descripción no aparece el bloque de instrucciones; la
  instrucción de no inventar va siempre al final.
- **Evidencia (test):** `src/lib/bot.test.ts`, bloque
  `construirSystemPrompt`: "con nombre: presenta al asistente con la empresa
  y el nombre", "sin nombre: presenta al asistente solo con la empresa",
  "con descripción: incluye las instrucciones de comportamiento", "con
  descripción nula: omite el bloque de instrucciones", "la instrucción de no
  inventar datos va siempre al final". Código: `src/lib/bot.ts:91-108`.

#### RF-04 — Conocimiento por bot

- **Actor:** visitante (lo percibe), usuario del panel (lo configura).
- **Descripción:** en cada mensaje se cargan las entradas de `conocimiento`
  del bot con `activo = true` y se añaden al prompt bajo "Base de
  conocimiento", con el título delante si lo tienen. Todo el conocimiento
  activo va entero en cada petición (no hay búsqueda ni recorte).
- **Criterio de aceptación:** solo entra el conocimiento activo del bot que
  responde; sin conocimiento no aparece la sección.
- **Evidencia:** test `src/lib/bot.test.ts`: "conocimiento con título:
  antepone el título al contenido", "conocimiento sin título: usa solo el
  contenido", "varias entradas de conocimiento: se separan con una línea en
  blanco", "conocimiento vacío: no aparece la base de conocimiento". Filtro
  por bot y `activo` (código, sin test): `src/lib/bot.ts:73-84`.

#### RF-05 — Historial limitado a 20 mensajes

- **Actor:** sistema.
- **Descripción:** al modelo se le envían, además del mensaje nuevo, los 20
  mensajes más recientes de la conversación, en orden cronológico. Limita
  coste y tamaño de contexto.
- **Criterio de aceptación:** en una conversación con más de 20 mensajes
  previos, OpenAI recibe system + 20 previos + el nuevo.
- **Evidencia (código):** constante `src/lib/bot.ts:11`; consulta
  `src/lib/bot.ts:58-71`; montaje `src/lib/bot.ts:110-125`. **Sin test.**

#### RF-06 — Persistencia de conversaciones y mensajes

- **Actor:** sistema.
- **Descripción:** la conversación se busca por bot + canal `web` +
  `session_id`; si no existe, se crea. El mensaje del usuario se guarda
  **antes** de llamar a OpenAI; la respuesta completa se guarda **al terminar**
  el stream, solo si no está vacía. Si falla el guardado de un mensaje, se
  registra en el log del servidor y la conversación sigue.
- **Criterio de aceptación:** tras chatear, la conversación y sus mensajes
  aparecen en `/admin/conversaciones`.
- **Evidencia (código):** `src/lib/bot.ts:26-56` y `src/lib/bot.ts:127-145`;
  orden en `src/app/api/chat/route.ts:58-66` y
  `src/app/api/chat/route.ts:90-95`. **Sin test.**
- **Consecuencias que conviene saber:** el `session_id` se genera en cada
  carga de la página (`src/components/chat/useChatSession.ts:12`), así que
  **recargar la web empieza otra conversación**. Si OpenAI falla, el mensaje
  del usuario queda guardado sin respuesta.

#### RF-07 — Validaciones de entrada de `/api/chat`

- **Actor:** sistema (frente a cualquier cliente HTTP).
- **Descripción:** antes de tocar Supabase u OpenAI, la ruta rechaza:
  JSON inválido → `400 "JSON inválido"`; falta `mensaje`, `bot_id` o
  `session_id`, alguno no es texto, o `mensaje` está en blanco → `400`;
  `mensaje` de más de 2000 caracteres → **`413`**; `bot_id` o `session_id` que
  no son UUID → `400 "Identificador inválido"`. La longitud se comprueba antes
  que el formato UUID.
- **Criterio de aceptación:** cada caso devuelve su código y ningún rechazo
  llama a Supabase ni a OpenAI. Un mensaje de exactamente 2000 caracteres pasa.
- **Evidencia (test):** `src/app/api/chat/route.test.ts`, bloque
  "POST /api/chat — validaciones de entrada" (14 casos): "JSON inválido → 400
  'JSON inválido'", "cuerpo null → 400 por campos ausentes", "falta %s → 400"
  (×3), "mensaje que no es texto → 400", "mensaje en blanco (%s) → 400" (×3),
  "bot_id que no es UUID → 400 'Identificador inválido'", "session_id que no
  es UUID → 400 'Identificador inválido'", "mensaje de 2001 caracteres →
  413", "documenta el orden actual: la longitud se valida antes que el UUID",
  "mensaje de exactamente 2000 caracteres → no se rechaza por longitud".
  Código: `src/app/api/chat/route.ts:10-50`.

#### RF-08 — Solo responden los bots activos

- **Actor:** sistema.
- **Descripción:** la API solo atiende a bots con `activo = true`; si no lo
  encuentra responde `404 "Bot no encontrado"` sin llamar a OpenAI.
- **Criterio de aceptación:** un bot desactivado desde el panel deja de
  responder.
- **Evidencia:** código `src/lib/bot.ts:13-24` y
  `src/app/api/chat/route.ts:52-56`. El test "mensaje de exactamente 2000
  caracteres → no se rechaza por longitud" demuestra el `404` sin llamada a
  OpenAI cuando el bot no aparece; el filtro por `activo` en sí no tiene test.
- **Ojo:** `/widget-embed` no filtra por `activo` (`src/app/widget-embed/page.tsx:21-25`):
  la burbuja de un bot desactivado se sigue pintando, pero al escribir sale el
  error del RF-09.

#### RF-09 — Error visible en el widget

- **Actor:** visitante.
- **Descripción:** si `/api/chat` responde con error (4xx/5xx) o la petición
  falla, el widget muestra en rojo "No se pudo enviar el mensaje. Inténtalo de
  nuevo.".
- **Criterio de aceptación:** con el backend parado o una clave de OpenAI
  inválida, el visitante ve ese aviso en vez de quedarse esperando.
- **Evidencia (código):** `src/components/chat/useChatSession.ts:42-44` y
  `src/components/chat/useChatSession.ts:76-77`; pintado
  `src/components/chat/ChatWidget.tsx:311-313`. **Sin test.** Lo de la clave
  inválida se deduce del código: si la llamada a OpenAI falla antes de empezar
  el stream, la ruta no lo captura y Next responde con error 500. No se ha
  ejecutado para este documento (ver [§10](#10-verificación-manual)).
- **Límite conocido:** si OpenAI falla **a mitad** del stream, el servidor lo
  registra en el log y cierra el stream sin avisar
  (`src/app/api/chat/route.ts:88-91`). El visitante ve una respuesta cortada o
  ninguna, **sin mensaje de error**. Ver [§11](#11-deuda-conocida-y-hoja-de-ruta).

#### RF-10 — Presentación segura de los mensajes

- **Actor:** visitante.
- **Descripción:** antes de pintar un mensaje, el widget escapa el HTML y
  solo después convierte en enlaces las URL `http(s)` (abren en otra pestaña
  con `noopener noreferrer`) y en negrita el texto entre `**`. El color del
  texto se elige según el contraste con el color del bot.
- **Criterio de aceptación:** un mensaje con `<script>` se ve como texto, no
  se ejecuta.
- **Evidencia (código):** `src/components/chat/ChatWidget.tsx:48-65` y
  `src/components/chat/ChatWidget.tsx:238-247`; contraste
  `src/components/chat/ChatWidget.tsx:31-46`. **Sin test.**

#### RF-11 — Texto a voz

- **Actor:** visitante.
- **Descripción:** cada respuesta del asistente tiene un botón de
  reproducir/pausar. Al pulsarlo, el widget pide el audio a `POST /api/tts`,
  que usa OpenAI (`tts-1`, voz `nova`, MP3). El audio se guarda en memoria del
  navegador para no pedirlo dos veces. Textos vacíos o de más de 2000
  caracteres → `400`.
- **Criterio de aceptación:** al pulsar el botón se oye la respuesta; la
  segunda vez no hay nueva petición.
- **Evidencia (código):** `src/app/api/tts/route.ts:4-26`; cliente
  `src/components/chat/ChatWidget.tsx:123-166` y
  `src/components/chat/ChatWidget.tsx:248-300`. **Sin test.**
- **Límites:** `/api/tts` no recibe ni comprueba el bot ni la sesión, y no
  protege `request.json()`: un cuerpo que no es JSON da error 500
  (`src/app/api/tts/route.ts:5`). Si el audio falla, el botón vuelve a su
  estado sin avisar (`src/components/chat/ChatWidget.tsx:161-162`).

#### RF-12 — Sala de demos con selector de bot

- **Actor:** equipo de Kobo (en una demo).
- **Descripción:** `/widget` lista los bots activos como botones; al elegir
  uno se monta su widget (`/widget?bot=<id>`). Si no se elige, usa
  `NEXT_PUBLIC_DEMO_BOT_ID` o el primer bot activo. Si no hay bots activos,
  muestra un aviso con el siguiente paso. La portada `/` enlaza a la sala.
- **Criterio de aceptación:** con el seed cargado aparecen Kobo y Bea; al
  cambiar de botón cambian nombre, color y comportamiento del chat.
- **Evidencia (código):** `src/app/widget/page.tsx:9-72` (consulta 23-28,
  elección 31, selector 42-56, aviso 66-70); portada `src/app/page.tsx:12-17`.
  **Sin test.**

### Panel

#### RF-13 — Panel con login

- **Actor:** usuario del panel.
- **Descripción:** todo `/admin/*` exige sesión de Supabase Auth; sin sesión
  redirige a `/admin/login`, y con sesión `/admin/login` redirige a
  `/admin/bots`. Login con email y contraseña; error genérico "Correo o
  contraseña incorrectos.". Botón de cerrar sesión. Las cookies de sesión no
  tienen caducidad: se borran al cerrar el navegador.
- **Criterio de aceptación:** sin login no se ve ninguna página del panel.
- **Evidencia (código):** `src/proxy.ts:4-30`; login
  `src/app/admin/login/page.tsx:14-33`; cierre
  `src/components/admin/LogoutButton.tsx:9-14`; cookies
  `src/lib/supabase/cookies.ts:8-13`. **Sin test.**
- **Límite:** no hay roles. Cualquier usuario creado en Supabase Auth tiene
  acceso total al panel (ver [§9](#9-qué-no-hace-hoy) y KOBO-05).

#### RF-14 — Gestión de bots

- **Actor:** usuario del panel.
- **Descripción:** `/admin/bots` lista los bots (id copiable con un clic,
  nombre, empresa, WhatsApp, estado). Se puede crear, editar y borrar (con
  confirmación). El formulario edita nombre, empresa, instrucciones, color,
  logo (ruta en `public/` o URL), número de WhatsApp, activo y "Generar ficha
  de oportunidad". **Cambiar las instrucciones o el conocimiento cambia el
  comportamiento del bot sin tocar código.**
- **Criterio de aceptación:** un cambio guardado en el panel se nota en el
  siguiente mensaje del chat.
- **Evidencia (código):** listado `src/app/admin/(dashboard)/bots/page.tsx`;
  formulario `src/components/admin/BotForm.tsx:27-197`; acciones
  `src/lib/actions/bots.ts:7-60`; copiar id
  `src/components/admin/CopyableId.tsx:9-31`; borrar
  `src/components/admin/DeleteBotButton.tsx:14-23`. **Sin test.**
- **Límites:** las acciones no comprueban sesión ni rol por sí mismas (solo
  las protege `src/proxy.ts`); borrar un bot borra en cascada todas sus
  conversaciones; el campo WhatsApp se guarda pero ningún código lo usa.

#### RF-15 — Gestión del conocimiento

- **Actor:** usuario del panel.
- **Descripción:** `/admin/bots/<id>/conocimiento` lista las entradas del bot
  (título, contenido recortado a 80 caracteres, estado) y permite añadir,
  editar y borrar. Las entradas nuevas se crean activas.
- **Criterio de aceptación:** una entrada añadida se usa en el siguiente
  mensaje del bot.
- **Evidencia (código):**
  `src/app/admin/(dashboard)/bots/[id]/conocimiento/page.tsx`;
  formulario `src/components/admin/ConocimientoForm.tsx:31-88`; acciones
  `src/lib/actions/conocimiento.ts:7-66` (alta activa: línea 24). **Sin test.**
- **Límite:** el panel muestra si una entrada está activa, pero **no permite
  cambiarlo**: el formulario no tiene ese campo. Desactivar una entrada solo
  se puede hacer en el SQL Editor.

#### RF-16 — Listado de conversaciones

- **Actor:** usuario del panel.
- **Descripción:** `/admin/conversaciones` lista las conversaciones de
  **todos** los bots, de la más reciente a la más antigua (bot, canal,
  identificador recortado, fecha), con un desplegable para filtrar por bot.
- **Criterio de aceptación:** tras chatear con Kobo, su conversación aparece
  la primera; al filtrar por Bea desaparece.
- **Evidencia (código):** `src/app/admin/(dashboard)/conversaciones/page.tsx:18-102`;
  consulta `src/lib/conversaciones.ts:12-33`; filtro
  `src/components/admin/ConversacionesBotFilter.tsx:11-38`. **Sin test.**

#### RF-17 — Detalle de conversación

- **Actor:** usuario del panel.
- **Descripción:** `/admin/conversaciones/<id>` muestra todos los mensajes en
  orden, con hora, y, si el bot tiene la ficha activada, la sección "Ficha de
  oportunidad" encima.
- **Criterio de aceptación:** se ve la conversación completa, no solo los
  últimos 20 mensajes.
- **Evidencia (código):**
  `src/app/admin/(dashboard)/conversaciones/[id]/page.tsx:86-171`; mensajes
  `src/lib/conversaciones.ts:51-66`. **Sin test.**

### Ficha de oportunidad (KOBO-04)

#### RF-18 — Activación por bot

- **Actor:** usuario del panel.
- **Descripción:** la ficha solo existe para bots con
  `genera_ficha_oportunidad = true`. Por defecto está desactivada. Se activa
  con una casilla del formulario del bot. En la demo: activada en Kobo,
  desactivada en Bea.
- **Criterio de aceptación:** en una conversación de Bea no aparece la
  sección ni el botón; en una de Kobo sí.
- **Evidencia:** columna `supabase/schema.sql:18-19`; seed
  `supabase/seed-demo.sql:37` (Kobo `true`) y `supabase/seed-demo.sql:76`
  (Bea `false`); casilla `src/components/admin/BotForm.tsx:163-184`; página
  `src/app/admin/(dashboard)/conversaciones/[id]/page.tsx:99-101` y
  `src/app/admin/(dashboard)/conversaciones/[id]/page.tsx:133-135`. La
  comprobación en servidor tiene test (RF-23).

#### RF-19 — Generación bajo demanda

- **Actor:** usuario del panel.
- **Descripción:** botón "Generar ficha" (o "Regenerar ficha" si ya existe).
  Genera la ficha con OpenAI a partir de **todos** los mensajes de la
  conversación y la guarda; si ya había una, la sustituye (una ficha por
  conversación). Muestra la fecha de generación. Los campos vacíos se ven como
  "No aparece en la conversación". Sin cron ni generación automática.
- **Criterio de aceptación:** tras el guion de Kobo, pulsar el botón muestra
  la ficha; pulsarlo otra vez la regenera.
- **Evidencia:** test `src/lib/actions/fichaOportunidad.test.ts`: "usuario
  autenticado sin rol admin → genera, valida y guarda la ficha". Código:
  acción `src/lib/actions/fichaOportunidad.ts:25-96` (guardado 1:1 con
  `upsert`, líneas 83-87); botón `src/components/admin/GenerarFichaButton.tsx:11-49`;
  vista `src/app/admin/(dashboard)/conversaciones/[id]/page.tsx:15-84`.

#### RF-20 — Esquema estricto

- **Actor:** sistema.
- **Descripción:** a OpenAI se le pide salida estructurada con un esquema
  JSON en modo estricto (`strict: true`, `additionalProperties: false`, todos
  los campos obligatorios aunque puedan ser `null`), temperatura 0 y máximo
  600 tokens. Las instrucciones de extracción dicen que solo cuenta lo que
  escribe el usuario, que lo que no aparece es `null` y que la conversación
  es material que analizar, no órdenes.
- **Criterio de aceptación:** la petición a OpenAI lleva el esquema en modo
  estricto.
- **Evidencia (test):** `src/lib/fichaOportunidad.test.ts`: "pide salida
  estructurada estricta y devuelve la ficha validada". Código: esquema
  `src/lib/fichaOportunidad.ts:23-48`; instrucciones
  `src/lib/fichaOportunidad.ts:50-60`; llamada
  `src/lib/fichaOportunidad.ts:211-227`.

#### RF-21 — Validación en código

- **Actor:** sistema.
- **Descripción:** aunque el esquema sea estricto, la respuesta del modelo se
  vuelve a validar en código antes de guardar nada: rechaza si no es un
  objeto, si falta algún campo o si algún tipo es erróneo; normaliza textos
  vacíos, listas vacías y contacto vacío a `null`. JSON mal formado, negativa
  del modelo o respuesta vacía también son error.
- **Criterio de aceptación:** una ficha con tipos erróneos no se guarda.
- **Evidencia (test):** `src/lib/fichaOportunidad.test.ts`, bloque
  `validarFicha` (acepta ficha completa, acepta todo `null`, normaliza vacíos,
  rechaza campos ausentes, contacto incompleto y tipos erróneos) y bloque
  `generarFichaOportunidad` ("lanza error si la ficha no cumple el esquema",
  "lanza error si el JSON está mal formado", "lanza error si el modelo se
  niega"); `src/lib/actions/fichaOportunidad.test.ts`: "OpenAI devuelve una
  ficha con tipos erróneos → no se guarda". Código:
  `src/lib/fichaOportunidad.ts:81-151` y `src/lib/fichaOportunidad.ts:229-248`.

#### RF-22 — Confirmación del contacto contra lo que escribió el usuario

- **Actor:** sistema.
- **Descripción:** "nunca afirmar lo que no se ha obtenido". El email solo se
  guarda si aparece literalmente (sin distinguir mayúsculas) en lo que
  escribió el usuario; el teléfono, si sus dígitos (6 o más) aparecen en los
  dígitos de lo que escribió el usuario. Si no, se descartan. Si no queda
  ningún dato, el contacto es `null`. **El nombre no se puede comprobar así**
  y depende solo de las instrucciones al modelo.
- **Criterio de aceptación:** si el modelo inventa un email que el usuario no
  dio, la ficha guardada no lo tiene.
- **Evidencia (test):** `src/lib/fichaOportunidad.test.ts`, bloque
  `confirmarContacto` ("mantiene email y teléfono que el usuario escribió",
  "descarta email y teléfono que no aparecen en lo que dijo el usuario", "si
  no queda ningún dato, contacto es null") y "descarta un email que el
  usuario no dio"; `src/lib/actions/fichaOportunidad.test.ts`: "sin contacto
  en la conversación → se guarda el contacto vacío aunque el modelo invente
  uno". Código: `src/lib/fichaOportunidad.ts:163-197` y
  `src/lib/fichaOportunidad.ts:250-255`.

#### RF-23 — Controles previos a OpenAI

- **Actor:** sistema (frente a cualquiera que invoque la acción).
- **Descripción:** la acción se defiende sola, en este orden y **antes de
  gastar en OpenAI**: (1) usuario autenticado con `getUser()`; si no, "No
  autorizado: inicia sesión en el panel.", sin leer nada; (2) id con formato
  UUID; (3) la conversación existe; (4) su bot tiene la ficha activada;
  (5) hay al menos un mensaje del usuario. No exige rol admin.
- **Criterio de aceptación:** en cada caso de rechazo no hay llamada a OpenAI
  ni escritura en la base de datos.
- **Evidencia (test):** `src/lib/actions/fichaOportunidad.test.ts`: "sin
  usuario autenticado → error de autorización, sin leer la conversación ni
  llamar a OpenAI", "getUser() con error de sesión → error de autorización,
  sin tocar nada", "bot con la columna %s → error sin llamar a OpenAI" (×2:
  `false` y columna ausente), "conversación inexistente → error sin llamar a
  OpenAI", "id que no es UUID → error sin consultar la base de datos",
  "conversación sin mensajes del usuario → error sin llamar a OpenAI".
  Código: `src/lib/actions/fichaOportunidad.ts:28-69`.

#### RF-24 — Errores explícitos de la ficha

- **Actor:** usuario del panel.
- **Descripción:** si falla la lectura de la conversación, OpenAI o el
  guardado, el panel muestra un mensaje concreto ("No se ha podido consultar
  la conversación.", "No se ha podido generar la ficha. Inténtalo de nuevo en
  unos minutos.", "La ficha se ha generado, pero no se ha podido guardar.") y
  no enseña una ficha vacía como si fuera real.
- **Criterio de aceptación:** con OpenAI caído, aparece el aviso en rojo bajo
  el botón y no se guarda nada.
- **Evidencia (test):** `src/lib/actions/fichaOportunidad.test.ts`: "fallo
  al leer la conversación → error explícito, no 'no encontrada'", "fallo de
  OpenAI → mensaje explícito y no se guarda nada", "fallo al guardar → error
  explícito"; `src/lib/fichaOportunidad.test.ts`: "propaga el fallo de la
  llamada a OpenAI". Pintado del error (código):
  `src/components/admin/GenerarFichaButton.tsx:42-46`.

### Resumen

| Id | Requisito | Verificación |
| --- | --- | --- |
| RF-01 | Widget embebible con una línea | Código |
| RF-02 | Chat con streaming | Código |
| RF-03 | Identidad e instrucciones por bot | Test |
| RF-04 | Conocimiento por bot | Test (montaje) + código (filtro) |
| RF-05 | Historial de 20 mensajes | Código |
| RF-06 | Persistencia | Código |
| RF-07 | Validaciones de `/api/chat` | Test |
| RF-08 | Solo bots activos | Test parcial + código |
| RF-09 | Error visible en el widget | Código |
| RF-10 | Presentación segura | Código |
| RF-11 | Texto a voz | Código |
| RF-12 | Sala de demos | Código |
| RF-13 | Panel con login | Código |
| RF-14 | Gestión de bots | Código |
| RF-15 | Gestión del conocimiento | Código |
| RF-16 | Listado de conversaciones | Código |
| RF-17 | Detalle de conversación | Código |
| RF-18 | Ficha: activación por bot | Código + test (servidor) |
| RF-19 | Ficha: bajo demanda | Test |
| RF-20 | Ficha: esquema estricto | Test |
| RF-21 | Ficha: validación en código | Test |
| RF-22 | Ficha: confirmación del contacto | Test |
| RF-23 | Ficha: controles previos | Test |
| RF-24 | Ficha: errores explícitos | Test |

**24 requisitos implementados**: 8 demostrados con test (RF-03, RF-07, RF-19
a RF-24), 3 con test parcial (RF-04, RF-08, RF-18) y 13 solo con lectura de
código. Todo lo que toca el navegador, el panel y Supabase real está sin test
automático: por eso existe la [§10](#10-verificación-manual).

---

## 6. Requisitos funcionales planificados

Uno por tarea de [`docs/BACKLOG.md`](BACKLOG.md). El detalle (alcance, qué no
tocar, criterio de hecho completo) está allí; aquí va el requisito resumido.

### Estado de las tareas del BACKLOG

| Tarea | Estado en `main` (`4928b66`) | Dónde está |
| --- | --- | --- |
| KOBO-02 — Tests mínimos con Vitest | **Hecha** (commit `f5aec9c`) | Base de las evidencias de test de la §5 |
| KOBO-04 — Ficha de oportunidad | **Hecha** (commit `4928b66`) | RF-18 a RF-24 |
| KOBO-03 — Rate limit | Pendiente | RFP-KOBO-03 |
| KOBO-05 — Panel por roles | Pendiente | RFP-KOBO-05 |
| KOBO-06 — Puerto LLM | Pendiente (añadida en KOBO-RF) | RFP-KOBO-06 |

Nota: `docs/BACKLOG.md` todavía describe KOBO-02 y KOBO-04 como tareas
abiertas; no marca cuáles están hechas.

#### RFP-KOBO-03 — Rate limit con puerto `RateLimiter`

- **Actor:** sistema (frente a visitantes y clientes HTTP).
- **Descripción:** limitar las peticiones a `/api/chat` y `/api/tts`, con
  límite principal por `session_id` y secundario, más holgado, por IP; claves
  separadas por `bot_id`. Al superarlo, `429` con mensaje en español y
  cabecera `Retry-After`. Las rutas hablan con un puerto `RateLimiter`; la
  primera implementación es un adaptador en memoria. `/api/tts` pasará a
  recibir y validar `bot_id` y `session_id`, y a proteger `request.json()`.
- **Criterio de aceptación:** un bucle de peticiones con el mismo
  `session_id` recibe `429` con `Retry-After`; el mismo `session_id` en dos
  bots lleva contadores separados; tests con temporizadores falsos.
- **Limitación ya asumida:** el adaptador en memoria no sirve con varias
  instancias ni en serverless; producción necesitará otro adaptador.
- **Dependencias:** KOBO-02 (hecha).

#### RFP-KOBO-05 — Panel por roles

- **Actor:** administrador por rol / usuario del panel.
- **Descripción:** solo usuarios con `app_metadata.rol === "admin"` pueden
  crear, editar o borrar bots y conocimiento. La comprobación va **dentro de
  cada server action** (helper `exigirAdmin()` con `getUser()`), porque las
  acciones usan la service role y RLS no las frena. RLS se endurece como
  defensa en profundidad. Nunca se lee el rol de `user_metadata`.
- **Criterio de aceptación:** un usuario sin rol admin recibe error de
  autorización y las tablas no cambian; ponerse el rol en `user_metadata` no
  sirve; un admin trabaja como hoy.
- **No cambia:** conversaciones y fichas siguen al alcance de cualquier
  usuario autenticado; el aislamiento por cliente es otra tarea (ver §11).
- **Dependencias:** KOBO-02 (hecha); va después de KOBO-04 (hecha).

#### RFP-KOBO-06 — Puerto LLM con adaptadores OpenAI y Anthropic

- **Actor:** usuario del panel (elige el modelo de cada bot); sistema.
- **Descripción:** el modelo de lenguaje pasa a estar detrás de un puerto
  propio (`ModeloLenguaje`) con dos operaciones: conversar en streaming (para
  `/api/chat`) y extraer JSON con esquema (para la ficha). Dos adaptadores:
  OpenAI (el comportamiento de hoy) y Anthropic. El proveedor y el modelo se
  eligen **por bot** desde el panel, con **Claude como modelo por defecto
  previsto**. La salida de cualquier proveedor sigue pasando por la validación
  en código de la ficha.
- **Voz:** **Anthropic no ofrece texto a voz**, así que `/api/tts` seguirá
  necesitando un proveedor con TTS (hoy OpenAI) y su clave, aunque todos los
  bots conversen con Claude.
- **Criterio de aceptación:** las rutas no importan ningún SDK de proveedor;
  un bot con Anthropic y otro con OpenAI responden en streaming en `/widget`;
  la ficha funciona con ambos; un fallo del proveedor se ve.
- **Decisión pendiente (Zabal):** modelo Claude concreto y si el chat usa uno
  más barato que la ficha; prioridad de la tarea en el orden del BACKLOG.
- **Dependencias:** KOBO-02 (hecha); recomendable después de KOBO-03.
