"use client";

import { useState, useCallback, useEffect } from "react";
import type { Medico, Cita } from "@/lib/types";
import DoctorSelector from "./DoctorSelector";
import DateTimePicker from "./DateTimePicker";
import SuccessConfirmation from "./SuccessConfirmation";

type FormState = "idle" | "loading" | "success" | "error";

interface ErrorInfo {
  message: string;
  suggestedSlots?: string[];
}

interface AppointmentFormProps {
  initialName?: string;
  initialPhone?: string;
  editingCita?: Cita | null;
  onCancelEdit?: () => void;
  onSuccess?: () => void;
}

export default function AppointmentForm({
  initialName = "",
  initialPhone = "",
  editingCita = null,
  onCancelEdit,
  onSuccess,
}: AppointmentFormProps) {
  // Dynamic list of doctors from backend
  const [medicos, setMedicos] = useState<Medico[]>([]);

  // Form fields
  const [selectedMedico, setSelectedMedico] = useState<Medico | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [nombrePaciente, setNombrePaciente] = useState(initialName);
  const [telefonoPaciente, setTelefonoPaciente] = useState(initialPhone);
  const [motivoConsulta, setMotivoConsulta] = useState("");

  // UI state
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Parse date-time ISO string in a timezone-independent manner
  const parseFechaHora = useCallback((isoStr?: string) => {
    if (!isoStr) return { date: null, time: null };
    const parts = isoStr.split("T");
    const dateStr = parts[0];
    const timeStr = parts[1] ? parts[1].substring(0, 5) : null;
    return { date: dateStr, time: timeStr };
  }, []);

  // Effect to pre-populate form states when editingCita is provided
  useEffect(() => {
    if (editingCita && medicos.length > 0) {
      const doc = medicos.find((m) => m.id === editingCita.medico_id) || null;
      setSelectedMedico(doc);

      const parsed = parseFechaHora(editingCita.fecha_hora_inicio);
      setSelectedDate(parsed.date);
      setSelectedTime(parsed.time);

      setNombrePaciente(editingCita.nombre_paciente);
      setTelefonoPaciente(editingCita.telefono_paciente);
      setMotivoConsulta(editingCita.motivo_consulta);
    } else if (!editingCita) {
      setSelectedMedico(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setNombrePaciente(initialName);
      setTelefonoPaciente(initialPhone);
      setMotivoConsulta("");
    }
  }, [editingCita, medicos, initialName, initialPhone, parseFechaHora]);

  // Fetch doctors on mount
  useEffect(() => {
    async function loadMedicos() {
      try {
        const res = await fetch("/api/medicos");
        if (res.ok) {
          const data = await res.json();
          setMedicos(data);
        }
      } catch (err) {
        console.error("Error al cargar médicos:", err);
      }
    }
    loadMedicos();
  }, []);

  // Step tracking for progressive disclosure on mobile
  const currentStep = !selectedMedico
    ? 1
    : !selectedDate || !selectedTime
    ? 2
    : 3;

  const getSlotsCallback = useCallback(
    async (medicoId: number, date: string) => {
      try {
        const res = await fetch(`/api/citas/slots?medicoId=${medicoId}&fecha=${date}`);
        if (!res.ok) {
          throw new Error("Error al obtener horarios.");
        }
        return await res.json();
      } catch (err) {
        console.error("Error en slots callback:", err);
        return [];
      }
    },
    []
  );

  function handleMedicoSelect(medico: Medico) {
    setSelectedMedico(medico);
    setSelectedDate(null);
    setSelectedTime(null);
    setErrorInfo(null);
  }

  function handleDateSelect(date: string) {
    setSelectedDate(date);
    setSelectedTime(null);
    setErrorInfo(null);
  }

  function handleTimeSelect(time: string) {
    setSelectedTime(time);
    setErrorInfo(null);
  }

  function handleSuggestedSlot(time: string) {
    setSelectedTime(time);
    setErrorInfo(null);
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!selectedMedico) errors.medico = "Selecciona un médico";
    if (!selectedDate) errors.fecha = "Selecciona una fecha";
    if (!selectedTime) errors.hora = "Selecciona una hora";
    if (!nombrePaciente.trim())
      errors.nombre = "Ingresa el nombre del paciente";
    if (!telefonoPaciente.trim()) {
      errors.telefono = "Ingresa un teléfono de contacto";
    } else if (!/^[\d\s\-+()]{7,15}$/.test(telefonoPaciente.trim())) {
      errors.telefono = "Formato de teléfono inválido";
    }
    if (!motivoConsulta.trim())
      errors.motivo = "Describe brevemente el motivo de la consulta";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    setFormState("loading");
    setErrorInfo(null);

    const fechaHoraInicio = `${selectedDate}T${selectedTime}`;

    try {
      const url = "/api/citas";
      const method = editingCita ? "PATCH" : "POST";
      const body = {
        ...(editingCita ? { id: editingCita.id } : {}),
        medico_id: selectedMedico!.id,
        nombre_paciente: nombrePaciente.trim(),
        telefono_paciente: telefonoPaciente.trim(),
        motivo_consulta: motivoConsulta.trim(),
        fecha_hora_inicio: fechaHoraInicio,
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setFormState("success");
      } else {
        setFormState("error");
        setErrorInfo({
          message: data.error || "Ocurrió un error al agendar la cita.",
          suggestedSlots: data.suggestedSlots,
        });
      }
    } catch (err: any) {
      setFormState("error");
      setErrorInfo({
        message: err.message || "Error de conexión con el servidor.",
      });
    }
  }

  function handleReset() {
    setSelectedMedico(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setNombrePaciente(initialName);
    setTelefonoPaciente(initialPhone);
    setMotivoConsulta("");
    setFormState("idle");
    setErrorInfo(null);
    setValidationErrors({});
    if (editingCita && onSuccess) {
      onSuccess();
    }
  }

  // Phone mask helper
  function handlePhoneChange(value: string) {
    const cleaned = value.replace(/[^\d\s\-+()]/g, "");
    setTelefonoPaciente(cleaned);
  }

  // Success view
  if (formState === "success" && selectedMedico && selectedDate && selectedTime) {
    return (
      <SuccessConfirmation
        medico={selectedMedico}
        fecha={selectedDate}
        hora={selectedTime}
        paciente={nombrePaciente}
        onReset={handleReset}
      />
    );
  }

  const stepLabels = ["Médico", "Horario", "Datos"];

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Progress indicator — properly aligned */}
      <div className="mb-6">
        <div className="flex items-center">
          {[1, 2, 3].map((step, index) => (
            <div key={step} className="flex items-center flex-1 last:flex-initial">
              {/* Step circle + label group */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold
                    transition-all duration-300 shrink-0
                    ${
                      step < currentStep
                        ? "bg-primary text-white"
                        : step === currentStep
                        ? "bg-primary/15 text-primary ring-2 ring-primary/40 dark:bg-primary/20 dark:text-primary-light"
                        : "bg-surface-light text-text-muted border border-border-subtle"
                    }
                  `}
                >
                  {step < currentStep ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                <span className="text-[11px] text-text-muted mt-1.5 font-medium">
                  {stepLabels[index]}
                </span>
              </div>

              {/* Connector line */}
              {step < 3 && (
                <div
                  className={`flex-1 h-0.5 rounded-full mx-3 mb-5 transition-colors duration-300 ${
                    step < currentStep ? "bg-primary/40" : "bg-border-subtle"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Doctor Selection */}
      <div>
        <DoctorSelector
          medicos={medicos}
          selectedMedico={selectedMedico}
          onSelect={handleMedicoSelect}
        />
        {validationErrors.medico && (
          <p className="mt-1.5 text-xs text-danger">{validationErrors.medico}</p>
        )}
      </div>

      {/* Step 2: Date & Time */}
      {selectedMedico && (
        <div className="animate-slide-up">
          <DateTimePicker
            medicoId={selectedMedico.id}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onDateSelect={handleDateSelect}
            onTimeSelect={handleTimeSelect}
            getSlots={getSlotsCallback}
          />
          {validationErrors.fecha && (
            <p className="mt-1.5 text-xs text-danger">
              {validationErrors.fecha}
            </p>
          )}
          {validationErrors.hora && (
            <p className="mt-1.5 text-xs text-danger">
              {validationErrors.hora}
            </p>
          )}
        </div>
      )}

      {/* Step 3: Patient Info */}
      {selectedMedico && selectedDate && selectedTime && (
        <div className="space-y-4 animate-slide-up">
          <div className="border-t border-border-subtle pt-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Datos del Paciente
            </h3>
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="patient-name"
              className="block text-sm font-medium text-text-muted mb-2"
            >
              Nombre completo
            </label>
            <input
              id="patient-name"
              type="text"
              value={nombrePaciente}
              onChange={(e) => setNombrePaciente(e.target.value)}
              placeholder="Ej: María García López"
              className={`w-full px-4 py-3.5 rounded-xl glass-light text-foreground
                placeholder:text-text-muted/60 focus-ring transition-all duration-200 text-sm
                ${validationErrors.nombre ? "ring-1 ring-danger/50" : ""}
              `}
            />
            {validationErrors.nombre && (
              <p className="mt-1.5 text-xs text-danger">
                {validationErrors.nombre}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="patient-phone"
              className="block text-sm font-medium text-text-muted mb-2"
            >
              Teléfono de contacto
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <input
                id="patient-phone"
                type="tel"
                value={telefonoPaciente}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="555-123-4567"
                className={`w-full pl-10 pr-4 py-3.5 rounded-xl glass-light text-foreground
                  placeholder:text-text-muted/60 focus-ring transition-all duration-200 text-sm
                  ${validationErrors.telefono ? "ring-1 ring-danger/50" : ""}
                `}
              />
            </div>
            {validationErrors.telefono && (
              <p className="mt-1.5 text-xs text-danger">
                {validationErrors.telefono}
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label
              htmlFor="patient-reason"
              className="block text-sm font-medium text-text-muted mb-2"
            >
              Motivo de consulta
            </label>
            <textarea
              id="patient-reason"
              rows={3}
              value={motivoConsulta}
              onChange={(e) => setMotivoConsulta(e.target.value)}
              placeholder="Describe brevemente el motivo de tu consulta..."
              className={`w-full px-4 py-3.5 rounded-xl glass-light text-foreground
                placeholder:text-text-muted/60 focus-ring transition-all duration-200 text-sm
                resize-none
                ${validationErrors.motivo ? "ring-1 ring-danger/50" : ""}
              `}
            />
            {validationErrors.motivo && (
              <p className="mt-1.5 text-xs text-danger">
                {validationErrors.motivo}
              </p>
            )}
          </div>

          {/* Error banner */}
          {errorInfo && (
            <div className="rounded-xl bg-danger-light border border-danger/20 p-4 animate-scale-in">
              <div className="flex items-start gap-3">
                <div className="text-danger mt-0.5 shrink-0">
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
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" x2="12" y1="8" y2="12" />
                    <line x1="12" x2="12.01" y1="16" y2="16" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-danger">
                    {errorInfo.message}
                  </p>
                  {errorInfo.suggestedSlots &&
                    errorInfo.suggestedSlots.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-text-muted mb-2">
                          Horarios disponibles para esta fecha:
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {errorInfo.suggestedSlots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => handleSuggestedSlot(slot)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium
                                bg-primary/10 text-primary hover:bg-primary/20
                                dark:bg-primary/15 dark:text-primary-light dark:hover:bg-primary/25
                                transition-colors cursor-pointer"
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}

          {/* Action button row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {editingCita && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="w-full sm:w-1/3 py-4 px-6 rounded-xl font-semibold text-sm
                  bg-surface-light text-text-muted hover:text-foreground hover:bg-surface border border-border-subtle
                  transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={formState === "loading"}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold text-sm
                transition-all duration-200 relative overflow-hidden
                ${
                  formState === "loading"
                    ? "bg-primary/50 text-white/60 cursor-wait"
                    : "bg-primary text-white hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                }
              `}
            >
              {formState === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="opacity-25"
                    />
                    <path
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      fill="currentColor"
                      className="opacity-75"
                    />
                  </svg>
                  {editingCita ? "Guardando cambios..." : "Agendando cita..."}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
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
                    <path d="m9 16 2 2 4-4" />
                  </svg>
                  {editingCita ? "Guardar Cambios" : "Confirmar Cita"}
                </span>
              )}

              {formState === "loading" && (
                <div
                  className="absolute inset-0 animate-shimmer"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
                    backgroundSize: "200% 100%",
                  }}
                />
              )}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
