"use client";

import { useState, useMemo, useEffect } from "react";

interface DateTimePickerProps {
  medicoId: number | null;
  selectedDate: string | null; // "YYYY-MM-DD"
  selectedTime: string | null; // "HH:mm"
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
  getSlots: (
    medicoId: number,
    date: string
  ) => Promise<{ time: string; available: boolean }[]>;
}

const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function formatDateISO(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function DateTimePicker({
  medicoId,
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  getSlots,
}: DateTimePickerProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    // getDay() returns 0=Sun, we want 0=Mon
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (Date | null)[] = [];

    // Padding for days before the 1st
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewYear, viewMonth, d));
    }

    return cells;
  }, [viewMonth, viewYear]);

  // Time slots for selected date (Async state and effect)
  const [timeSlots, setTimeSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!medicoId || !selectedDate) {
      setTimeSlots([]);
      return;
    }
    let active = true;
    async function loadSlots() {
      setLoadingSlots(true);
      try {
        const slots = await getSlots(medicoId!, selectedDate!);
        if (active) {
          setTimeSlots(slots);
        }
      } catch (err) {
        console.error("Error fetching slots:", err);
      } finally {
        if (active) {
          setLoadingSlots(false);
        }
      }
    }
    loadSlots();
    return () => {
      active = false;
    };
  }, [medicoId, selectedDate, getSlots]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function isDayDisabled(date: Date): boolean {
    const dow = date.getDay();
    // Weekends
    if (dow === 0 || dow === 6) return true;
    // Past days
    if (date < today) return true;
    return false;
  }

  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div>
        <label className="block text-sm font-medium text-text-muted mb-3">
          {/* Calendar SVG */}
          <span className="inline-flex items-center gap-2">
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
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
            Fecha de la cita
          </span>
        </label>

        <div className="glass-light rounded-xl p-4">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              disabled={!canGoPrev}
              className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-foreground
                transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Mes anterior"
            >
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
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            <span className="text-sm font-semibold text-foreground">
              {MONTHS_ES[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-foreground transition-colors"
              aria-label="Mes siguiente"
            >
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
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_ES.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-text-muted py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, i) => {
              if (!date) {
                return <div key={`empty-${i}`} className="aspect-square" />;
              }

              const disabled = isDayDisabled(date);
              const dateStr = formatDateISO(date);
              const isSelected = selectedDate === dateStr;
              const isToday = isSameDay(date, today);

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={disabled}
                  onClick={() => onDateSelect(dateStr)}
                  className={`aspect-square flex items-center justify-center rounded-lg text-sm
                    transition-all duration-150 relative
                    ${
                      disabled
                        ? "text-text-muted/30 cursor-not-allowed"
                        : "hover:bg-primary/15 cursor-pointer text-foreground"
                    }
                    ${
                      isSelected
                        ? "bg-primary text-white font-semibold ring-1 ring-primary/50"
                        : ""
                    }
                  `}
                >
                  {date.getDate()}
                  {isToday && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="animate-slide-up">
          <label className="block text-sm font-medium text-text-muted mb-3">
            <span className="inline-flex items-center gap-2">
              {/* Clock SVG */}
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
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Hora disponible
            </span>
          </label>

          {loadingSlots ? (
            <div className="glass-light rounded-xl p-6 text-center flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
              </svg>
              <span className="text-text-muted text-sm">Cargando horarios disponibles...</span>
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="glass-light rounded-xl p-6 text-center">
              <p className="text-text-muted text-sm">
                {medicoId
                  ? "El médico no tiene horario laboral este día."
                  : "Selecciona un médico primero."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {timeSlots.map((slot, idx) => {
                const isSelected = selectedTime === slot.time;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => onTimeSelect(slot.time)}
                    title={
                      !slot.available ? "Horario ocupado" : `Seleccionar ${slot.time}`
                    }
                    style={{ animationDelay: `${idx * 30}ms` }}
                    className={`slot-enter py-2.5 px-3 rounded-xl text-sm font-medium
                      transition-all duration-150
                      ${
                        !slot.available
                          ? "bg-danger-light text-danger/60 cursor-not-allowed line-through"
                          : isSelected
                          ? "bg-primary text-white ring-2 ring-primary/50 scale-105 shadow-lg shadow-primary/10"
                          : "glass-light text-foreground hover:bg-primary/10 hover:text-primary hover:scale-[1.03] cursor-pointer"
                      }
                    `}
                  >
                    {slot.time}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
