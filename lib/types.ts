// ============================================================
// Hospital Covadonga — Tipos Compartidos
// Reemplaza los tipos que estaban en mock-data.ts
// ============================================================

export type Especialidad =
  | "Alergología"
  | "Algología"
  | "Anatomopatología"
  | "Anestesiología"
  | "Angiología"
  | "Cardiología Adulto y pediátrica"
  | "Cardiología Intervencionista"
  | "Cirugía General Adulto y Pediátrica"
  | "Cirugía Laparoscópica"
  | "Cirugía Plástica y Estética"
  | "Dermatología"
  | "Electrofisiología"
  | "Endocrinología"
  | "Fisiatría y Rehabilitación"
  | "Gastroenterología"
  | "Ginecología y Obstetricia"
  | "Ginecología Oncológica"
  | "Neumología"
  | "Medicina Interna"
  | "Medicina crítica"
  | "Neonatología"
  | "Neurocirugía Adulto y Pediatrica"
  | "Neuro Radiología e Intervencionista"
  | "Nutriología"
  | "Odontología, Endodoncia, Cir. Maxilofacial"
  | "Oftalmología Retinología y Glaucoma"
  | "Oncología"
  | "Otorrinolaringología"
  | "Psiquiatría Adulto y Pediátrica"
  | "Pediatría"
  | "Proctología"
  | "Radiología"
  | "Reumatología"
  | "Traumatología y Ortopedia Adulto y Pediátrico"
  | "Urología";

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
