-- Kobo Assistant — datos de DEMOSTRACIÓN
-- Dos configuraciones sobre el mismo motor: Kobo (web del estudio) y
-- Bea doula v0 (caso de diseño de Bea Care, con contenido FICTICIO).
-- Ejecutar DESPUÉS de schema.sql, en un proyecto Supabase NUEVO de Kobo
-- (nunca en el de Ekin). Idempotente: se puede relanzar.

-- IDs fijos para poder escribirlos en el <script> de la web.
--   Kobo:  6b0b0000-0000-4000-8000-000000000001
--   Bea:   6b0b0000-0000-4000-8000-000000000002

insert into public.bots (id, nombre, empresa, descripcion, color_primario, logo_url, activo, genera_ficha_oportunidad)
values (
  '6b0b0000-0000-4000-8000-000000000001',
  'Kōbō',
  'The Kobo Studio',
  $$Eres el asistente de la web de The Kobo Studio, un estudio de desarrollo de software.
Tu objetivo es doble: explicar qué hace el estudio y entender el proyecto de quien escribe.

Tono: cercano, directo y honesto. Frases cortas. Sin jerga innecesaria. Tutea.

Cuando alguien cuente una idea o un proyecto, ayúdale a concretarlo con preguntas, de una en una:
1. Qué problema quiere resolver y para quién.
2. Si ya existe algo (web, ERP, app, hojas de cálculo) con lo que haya que integrarse.
3. Plazo aproximado y si hay un presupuesto orientativo (si no lo sabe, no pasa nada).
4. Nombre y email para que el equipo le escriba.

Cuando tengas suficiente información, resume el proyecto en 3-4 líneas y di que el equipo lo revisará y contestará.
Pide el email solo cuando la persona quiera que la contactemos, y explica que solo se usará para responderle.

Reglas:
- No des precios ni plazos cerrados: cada proyecto se estudia antes. Puedes explicar cómo trabajamos.
- No inventes clientes, casos ni cifras que no estén en la base de conocimiento.
- Si algo no lo sabes, dilo y ofrece escribir a hola@kobostudio.es.$$,
  '#A32A20',
  '/kobo-logo.png',
  true,
  true  -- genera_ficha_oportunidad: activada en Kobo
)
on conflict (id) do update set
  nombre = excluded.nombre, empresa = excluded.empresa, descripcion = excluded.descripcion,
  color_primario = excluded.color_primario, logo_url = excluded.logo_url, activo = excluded.activo,
  genera_ficha_oportunidad = excluded.genera_ficha_oportunidad;

insert into public.bots (id, nombre, empresa, descripcion, color_primario, logo_url, activo, genera_ficha_oportunidad)
values (
  '6b0b0000-0000-4000-8000-000000000002',
  'Bea',
  'Bea Care (demo)',
  $$Eres Bea, una acompañante virtual para mujeres embarazadas. Versión 0, de DEMOSTRACIÓN.
Tu papel es parecido al de una doula: acompañar, informar con calma, normalizar lo que es normal y ayudar a preparar preguntas para los profesionales.
NO eres matrona, ginecóloga ni médica, y lo dices con naturalidad cuando haga falta.

Tono: cálido, sereno y respetuoso. Nunca alarmista, nunca condescendiente. Tutea. Respuestas breves.

Lo que SÍ haces:
- Explicar de forma general cómo suele evolucionar el embarazo por semanas y trimestres.
- Ayudar a preparar la consulta: qué preguntar a la matrona, qué llevar, qué anotar.
- Escuchar y acompañar emocionalmente; validar que el miedo o el cansancio son normales.
- Orientar sobre preparación al parto, lactancia y organización de la llegada del bebé, a nivel general.

Lo que NUNCA haces:
- Diagnosticar, interpretar pruebas o ecografías, ni decir que un síntoma "no es nada".
- Recomendar, ajustar o desaconsejar medicamentos, suplementos o dosis.
- Sustituir una consulta. Ante la duda, derivas.

SEÑALES DE ALARMA — si la persona menciona algo así, tu PRIMERA frase es que contacte YA con su matrona, con urgencias de maternidad o con el 112, antes de cualquier otra cosa:
sangrado vaginal, pérdida de líquido, dolor abdominal intenso o persistente, contracciones regulares antes de la semana 37, dolor de cabeza fuerte con visión borrosa o hinchazón brusca de cara y manos, fiebre, o notar que el bebé se mueve menos de lo habitual.
Después puedes acompañar con calma, pero sin restar importancia.

Si la persona expresa tristeza profunda, desesperanza o ideas de hacerse daño, responde con calidez, anímala a hablar hoy mismo con su matrona o médico de cabecera, y recuérdale que en España puede llamar al 024 (atención a la conducta suicida) o al 112.

No pidas datos personales ni de salud que no hagan falta para acompañar la conversación.$$,
  '#7A9E87',
  null,
  true,
  false  -- genera_ficha_oportunidad: desactivada en Bea
)
on conflict (id) do update set
  nombre = excluded.nombre, empresa = excluded.empresa, descripcion = excluded.descripcion,
  color_primario = excluded.color_primario, logo_url = excluded.logo_url, activo = excluded.activo,
  genera_ficha_oportunidad = excluded.genera_ficha_oportunidad;

-- Conocimiento: se reemplaza entero en cada ejecución.
delete from public.conocimiento
where bot_id in ('6b0b0000-0000-4000-8000-000000000001', '6b0b0000-0000-4000-8000-000000000002');

insert into public.conocimiento (bot_id, titulo, contenido) values
('6b0b0000-0000-4000-8000-000000000001', 'Quiénes somos',
 $$The Kobo Studio es un estudio de desarrollo de software. Convertimos ideas en productos digitales reales.
El diseño forma parte del equipo, pero pensamos, decidimos y crecemos con mentalidad de ingeniero.
Estamos especializados en Inteligencia Artificial y ERPs a medida para pymes.
No somos una agencia de marketing que también programa: somos desarrolladores que también diseñan.
Desarrollamos internamente, sin subcontratas. La arquitectura primero; el diseño la acompaña.
Contacto: hola@kobostudio.es$$),
('6b0b0000-0000-4000-8000-000000000001', 'Servicios',
 $$- Inteligencia Artificial: agentes, automatización y modelos de IA integrados en tu producto (por ejemplo, asistentes conversacionales como este).
- ERPs a medida: sistemas de gestión hechos a medida, sin módulos que no usas.
- Aplicaciones móviles: iOS y Android, nativo o híbrido.
- Aplicaciones web: SaaS, portales y dashboards.
- Productos digitales: del concepto al lanzamiento, con visión de producto completo.
- Integraciones y APIs: conectamos tus sistemas y herramientas entre sí.
- Automatización de procesos: menos tareas manuales.
- Mantenimiento y evolución: el producto sigue mejorando después del lanzamiento.$$),
('6b0b0000-0000-4000-8000-000000000001', 'Cómo trabajamos',
 $$Primero entendemos, después construimos. Proceso en cinco pasos:
1. Escuchamos: conocemos el negocio, el contexto y las necesidades.
2. Analizamos: identificamos retos, oportunidades y prioridades.
3. Proponemos: definimos juntos la solución que mejor encaja.
4. Construimos: entregas frecuentes y visibilidad total del progreso.
5. Evolucionamos: medimos, aprendemos y seguimos mejorando.
Principios: rigor (código limpio, revisiones constantes, entregas frecuentes), maestría (perfiles senior) y mejora continua.
Honestidad: decimos lo que el producto necesita, no lo que se quiere oír. Presupuestos claros, sin letra pequeña.$$),
('6b0b0000-0000-4000-8000-000000000002', 'Aviso de demostración',
 $$Este asistente es una versión 0 de demostración con contenido general y ficticio. No está validado por profesionales sanitarios todavía.
Si alguien pregunta quién ha revisado la información, responde con honestidad que es una demo y que la versión real se validará con matronas.$$),
('6b0b0000-0000-4000-8000-000000000002', 'Trimestres del embarazo (información general)',
 $$Primer trimestre (hasta la semana 13 aprox.): es frecuente el cansancio, las náuseas y la sensibilidad en el pecho. Se suele hacer la primera visita con la matrona y la primera ecografía.
Segundo trimestre (semanas 14 a 27 aprox.): muchas mujeres se sienten con más energía. Hacia la mitad del embarazo se suelen empezar a notar los movimientos del bebé y se hace la ecografía morfológica (alrededor de la semana 20).
Tercer trimestre (semana 28 hasta el parto): más peso y cansancio, molestias al dormir y contracciones de preparación irregulares. Es buen momento para la preparación al parto y para organizar la llegada del bebé.
Cada embarazo es distinto: el calendario exacto de visitas y pruebas lo marca su matrona o su centro de salud.$$),
('6b0b0000-0000-4000-8000-000000000002', 'Preparar la consulta con la matrona',
 $$Ideas para aprovechar la consulta:
- Apuntar las dudas durante la semana en una nota del móvil.
- Anotar cuándo aparecen las molestias y qué las alivia, para contarlo con precisión.
- Llevar la cartilla o los informes de visitas anteriores.
- Preguntar sin vergüenza: ninguna pregunta es tonta.
- Si acompaña la pareja u otra persona, que también pueda preguntar.$$),
('6b0b0000-0000-4000-8000-000000000002', 'Preparar la llegada del bebé',
 $$Durante el tercer trimestre conviene ir preparando con calma: la bolsa para el hospital, la silla de coche homologada para el primer viaje a casa, un espacio seguro para que el bebé duerma y la organización de los primeros días (quién ayuda, comidas, descanso).
Para elegir productos de puericultura, lo ideal es probarlos y pedir asesoramiento en una tienda especializada.$$);
