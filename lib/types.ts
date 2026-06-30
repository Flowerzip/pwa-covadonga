// ============================================================
// Hospital Covadonga — Tipos Compartidos
// Reemplaza los tipos que estaban en mock-data.ts
// ============================================================

export type Especialidad =
  | "Alergología"
  | "Algología"
  | "Cardiología"
  | "Dermatología"
  | "Neurología"
  | "Oftalmología"
  | "Pediatría"
  | "Traumatología";

export interface Medico {
  id: number;
  nombre: string;
  especialidad: Especialidad;
  consultorio: string;
}

export type EstadoCita = "confirmada" | "cancelada" | "pendiente";

export interface Cita {
  id: number;
  medico_id: number;
  usuario_id?: string;
  nombre_paciente: string;
  telefono_paciente: string;
  motivo_consulta: string;
  fecha_hora_inicio: string; // ISO string
  estado: EstadoCita;
  recordatorio_enviado?: boolean;
  medico_nombre?: string;
  medico_especialidad?: string;
  medico_consultorio?: string;
}

export interface Usuario {
  id: string; // UUID
  nombre_completo: string;
  telefono: string;
  es_admin?: boolean;
  creado_en?: string;
}

export interface TimeSlot {
  time: string;   // "HH:mm"
  available: boolean;
}

export interface HorarioLaboral {
  id: number;
  medico_id: number;
  dia_semana: number; // 1=Lun ... 7=Dom
  hora_inicio: string; // "HH:mm:ss"
  hora_fin: string;    // "HH:mm:ss"
}
