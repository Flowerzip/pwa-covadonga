"use client";

import { useState, useEffect } from "react";
import type { Cita } from "@/lib/types";

interface MyAppointmentsProps {
  onNewAppointment: () => void;
  phoneFilter?: string;
  onEditAppointment?: (cita: EnrichedCita) => void;
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

function formatFechaCorta(dateStr: string): string {
  const date = new Date(dateStr);
  return `${DAYS_ES[date.getDay()]} ${date.getDate()} de ${MONTHS_ES[date.getMonth()]}`;
}

function getHora(dateStr: string): string {
  const date = new Date(dateStr);
  const hrs = String(date.getHours()).padStart(2, "0");
  const mins = String(date.getMinutes()).padStart(2, "0");
  return `${hrs}:${mins}`;
}

const estadoBadge: Record<string, string> = {
  confirmada: "bg-success-light text-success",
  pendiente: "bg-accent/10 text-accent dark:text-accent-light",
  cancelada: "bg-danger-light text-danger",
};

const estadoLabel: Record<string, string> = {
  confirmada: "Confirmada",
  pendiente: "Pendiente",
  cancelada: "Cancelada",
};

interface EnrichedCita extends Cita {
  medico_nombre?: string;
  medico_especialidad?: string;
  medico_consultorio?: string;
}

export default function MyAppointments({
  onNewAppointment,
  phoneFilter,
  onEditAppointment,
}: MyAppointmentsProps) {
  const [appointments, setAppointments] = useState<EnrichedCita[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  async function handleCancel(id: number) {
    setCancelLoading(true);
    try {
      const res = await fetch("/api/citas", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, estado: "cancelada" }),
      });

      if (res.ok) {
        // Update local state to mark appointment as cancelled
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, estado: "cancelada" } : a))
        );
        setCancellingId(null);
      } else {
        const data = await res.json();
        alert(data.error || "No se pudo cancelar la cita.");
      }
    } catch (err) {
      console.error("Error al cancelar cita:", err);
      alert("Error al conectar con el servidor.");
    } finally {
      setCancelLoading(false);
    }
  }

  useEffect(() => {
    if (!phoneFilter) return;
    const cleanPhone = phoneFilter.replace(/\D/g, "");

    let active = true;
    async function loadAppointments() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/citas?telefono=${cleanPhone}`);
        if (!res.ok) {
          throw new Error("No se pudieron cargar tus citas.");
        }
        const data = await res.json();
        if (active) {
          setAppointments(data);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || "Error al conectar con el servidor.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAppointments();
    return () => {
      active = false;
    };
  }, [phoneFilter]);

  if (loading) {
    return (
      <div className="glass rounded-2xl p-8 sm:p-10 text-center shadow-lg shadow-primary/5 dark:shadow-black/30 flex flex-col items-center justify-center min-h-[200px]">
        <svg className="animate-spin h-8 w-8 text-primary mb-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
        </svg>
        <p className="text-sm text-text-muted">Cargando tus citas registradas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 sm:p-10 text-center shadow-lg shadow-primary/5 dark:shadow-black/30">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-danger/10 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-danger">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Error al obtener citas</h3>
        <p className="text-sm text-text-muted mb-6">{error}</p>
        <button
          type="button"
          onClick={() => {
            // Trigger refresh by updating state or refetching
            setAppointments([]);
            const cleanPhone = phoneFilter?.replace(/\D/g, "");
            if (cleanPhone) {
              setLoading(true);
              fetch(`/api/citas?telefono=${cleanPhone}`)
                .then((res) => res.json())
                .then((data) => {
                  setAppointments(data);
                  setError(null);
                })
                .catch((err) => setError(err.message))
                .finally(() => setLoading(false));
            }
          }}
          className="py-2.5 px-6 rounded-xl font-semibold text-sm bg-primary text-white hover:bg-primary-dark transition-all"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 sm:p-10 text-center shadow-lg shadow-primary/5 dark:shadow-black/30">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-light flex items-center justify-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-muted"
          >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Sin citas registradas
        </h3>
        <p className="text-sm text-text-muted mb-6">
          Aún no tienes citas agendadas. ¡Agenda tu primera consulta!
        </p>
        <button
          type="button"
          onClick={onNewAppointment}
          className="inline-flex items-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm
            bg-primary text-white hover:bg-primary-dark
            hover:shadow-lg hover:shadow-primary/15 hover:scale-[1.02]
            active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" x2="12" y1="5" y2="19" />
            <line x1="5" x2="19" y1="12" y2="12" />
          </svg>
          Agendar Cita
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">
          Mis Citas
        </h2>
        <span className="text-xs text-text-muted bg-surface-light px-2.5 py-1 rounded-full border border-border-subtle">
          {appointments.length} cita{appointments.length !== 1 ? "s" : ""}
        </span>
      </div>

      {appointments.map((appt, index) => (
        <div
          key={appt.id}
          className={`glass rounded-xl p-4 sm:p-5 shadow-sm shadow-primary/5 dark:shadow-black/20 animate-slide-up transition-opacity duration-300 ${
            appt.estado === "cancelada" ? "opacity-60 saturate-50" : ""
          }`}
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              {/* Doctor avatar placeholder */}
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M18 20a6 6 0 0 0-12 0" />
                  <circle cx="12" cy="10" r="4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {appt.medico_nombre || "Médico"}
                </p>
                <p className="text-xs text-text-muted">
                  {appt.medico_especialidad}
                  {appt.medico_consultorio && ` · Cons. ${appt.medico_consultorio}`}
                </p>
              </div>
            </div>
            <span
              className={`text-[11px] px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
                estadoBadge[appt.estado] || ""
              }`}
            >
              {estadoLabel[appt.estado] || appt.estado}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {/* Date */}
            <div className="flex items-center gap-1.5 text-text-muted">
              <svg
                width="14"
                height="14"
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
              <span className="text-xs">{formatFechaCorta(appt.fecha_hora_inicio)}</span>
            </div>
            {/* Time */}
            <div className="flex items-center gap-1.5 text-primary">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-xs font-semibold">{getHora(appt.fecha_hora_inicio)} hrs</span>
            </div>
          </div>

          {/* Patient & Reason */}
          <div className="mt-3 pt-3 border-t border-border-subtle flex flex-col xs:flex-row xs:items-center justify-between gap-3">
            <p className="text-xs text-text-muted max-w-xs leading-relaxed">
              <span className="font-semibold text-foreground">{appt.nombre_paciente}</span>
              {" · "}{appt.motivo_consulta}
            </p>

            {/* Action buttons (Edit / Cancel) */}
            {appt.estado !== "cancelada" && (
              <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onEditAppointment?.(appt)}
                className="py-1.5 px-3 rounded-lg text-xs font-semibold
                  bg-primary/10 text-primary hover:bg-primary/20
                  transition-all duration-150 flex items-center gap-1 cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
                Editar
              </button>
              
              {cancellingId === appt.id ? (
                <div className="flex items-center gap-1.5 animate-scale-in">
                  <span className="text-[10px] text-text-muted font-medium">¿Seguro?</span>
                  <button
                    type="button"
                    onClick={() => handleCancel(appt.id)}
                    disabled={cancelLoading}
                    className="py-1.5 px-2 rounded-lg text-xs font-bold
                      bg-danger text-white hover:bg-danger-dark
                      transition-all duration-150 cursor-pointer disabled:opacity-50"
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setCancellingId(null)}
                    className="py-1.5 px-2 rounded-lg text-xs font-medium
                      bg-surface-light text-text-muted hover:text-foreground border border-border-subtle
                      transition-all duration-150 cursor-pointer"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCancellingId(appt.id)}
                  className="py-1.5 px-3 rounded-lg text-xs font-semibold
                    bg-danger/10 text-danger hover:bg-danger/20
                    transition-all duration-150 flex items-center gap-1 cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                  Cancelar
                </button>
              )}
            </div>
            )}
          </div>
        </div>
      ))}

      {/* Add new appointment button */}
      <button
        type="button"
        onClick={onNewAppointment}
        className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm
          border-2 border-dashed border-border-subtle text-text-muted
          hover:border-primary hover:text-primary hover:bg-primary/5
          transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" x2="12" y1="5" y2="19" />
          <line x1="5" x2="19" y1="12" y2="12" />
        </svg>
        Agendar otra cita
      </button>
    </div>
  );
}
