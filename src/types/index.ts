export interface Bot {
  id: string;
  nombre: string;
  empresa: string;
  descripcion: string | null;
  color_primario: string;
  logo_url: string | null;
  activo: boolean;
  whatsapp_numero: string | null;
  genera_ficha_oportunidad: boolean;
  created_at: string;
}

export type Canal = "web" | "whatsapp";

export interface Conversacion {
  id: string;
  bot_id: string;
  canal: Canal;
  identificador: string;
  created_at: string;
}

export type RolMensaje = "user" | "assistant";

export interface Mensaje {
  id: string;
  conversacion_id: string;
  rol: RolMensaje;
  contenido: string;
  created_at: string;
}

export interface Conocimiento {
  id: string;
  bot_id: string;
  titulo: string | null;
  contenido: string;
  activo: boolean;
  created_at: string;
}

export interface ContactoLead {
  nombre: string | null;
  email: string | null;
  telefono: string | null;
}

/**
 * Resumen estructurado del lead (KOBO-04). Cada campo puede ser null: si la
 * conversación no lo dice, no se inventa.
 */
export interface FichaOportunidad {
  problema: string | null;
  sector: string | null;
  integraciones: string[] | null;
  plazo: string | null;
  contacto: ContactoLead | null;
}

export interface FichaOportunidadGuardada extends FichaOportunidad {
  conversacion_id: string;
  generada_at: string;
}
