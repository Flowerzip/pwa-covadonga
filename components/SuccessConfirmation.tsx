"use client";

import type { Medico } from "@/lib/types";

interface SuccessConfirmationProps {
  medico: Medico;
  fecha: string; // "YYYY-MM-DD"
  hora: string; // "HH:mm"
  paciente: string;
  onReset: () => void;
}

const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const DAYS_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function formatFechaLarga(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAYS_ES[date.getDay()]} ${d} de ${MONTHS_ES[m - 1]} de ${y}`;
}

export default function SuccessConfirmation({
  medico,
  fecha,
  hora,
  paciente,
  onReset,
}: SuccessConfirmationProps) {
  return (
    <div className="flex flex-col items-center text-center animate-scale-in py-4">
      {/* Animated checkmark */}
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full bg-success/20 animate-pulse-soft" />
        <div className="absolute inset-2 rounded-full bg-success/10 flex items-center justify-center">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-success"
          >
            <path
              d="M5 13l4 4L19 7"
              style={{
                strokeDasharray: 100,
                strokeDashoffset: 100,
                animation: "checkDraw 0.6s ease-out 0.3s forwards",
              }}
            />
          </svg>
        </div>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2">
        ¡Cita Confirmada!
      </h2>
      <p className="text-text-muted text-sm mb-6">
        Tu cita ha sido agendada exitosamente
      </p>

      {/* Appointment summary card */}
      <div className="w-full glass-light rounded-xl p-5 text-left space-y-3 mb-6">
        {/* Doctor */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-primary shrink-0">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 20a6 6 0 0 0-12 0" />
              <circle cx="12" cy="10" r="4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-text-muted">Médico</p>
            <p className="text-sm font-medium text-foreground">
              {medico.nombre}
            </p>
            <p className="text-xs text-text-muted">
              {medico.especialidad} — Consultorio {medico.consultorio}
            </p>
          </div>
        </div>

        <div className="border-t border-border-subtle" />

        {/* Date & Time */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-primary shrink-0">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-text-muted">Fecha y hora</p>
            <p className="text-sm font-medium text-foreground">
              {formatFechaLarga(fecha)}
            </p>
            <p className="text-sm font-semibold text-primary">{hora} hrs</p>
          </div>
        </div>

        <div className="border-t border-border-subtle" />

        {/* Patient */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-primary shrink-0">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-text-muted">Paciente</p>
            <p className="text-sm font-medium text-foreground">{paciente}</p>
          </div>
        </div>
      </div>

      {/* Reset button */}
      <button
        type="button"
        onClick={onReset}
        className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm
          bg-primary text-white hover:bg-primary-dark
          hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02]
          active:scale-[0.98] transition-all duration-200"
      >
        ¡Listo!
      </button>
    </div>
  );
}
