# Kobo Assistant

Motor de asistentes conversacionales de **The Kobo Studio**. Un motor, muchas
configuraciones: cada bot tiene su identidad, sus instrucciones y su base de
conocimiento, y se instala en cualquier web con una línea.

Derivado de Zorion Chat (rama `zabal-develop`, commit `f988ec2`). En esta
variante se han retirado a propósito AimHarder, WhatsApp/Twilio y el cron.

- Montaje y guion de la demo: [`docs/DEMO.md`](docs/DEMO.md)
- Esquema: [`supabase/schema.sql`](supabase/schema.sql)
- Datos de demo (Kobo + Bea doula v0): [`supabase/seed-demo.sql`](supabase/seed-demo.sql)

```bash
npm install
cp .env.example .env.local   # rellenar claves de Kobo, nunca las de Ekin
npm run dev                  # http://localhost:3000
```
