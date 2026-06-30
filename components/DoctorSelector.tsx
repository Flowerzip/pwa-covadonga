"use client";

import { useState, useRef, useEffect } from "react";
import type { Medico } from "@/lib/types";

interface DoctorSelectorProps {
  medicos: Medico[];
  selectedMedico: Medico | null;
  onSelect: (medico: Medico) => void;
}

const especialidadColors: Record<string, string> = {
  Alergología: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  Algología: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  Cardiología: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  Dermatología: "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
  Neurología: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  Oftalmología: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  Pediatría: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Traumatología: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
};

export default function DoctorSelector({
  medicos,
  selectedMedico,
  onSelect,
}: DoctorSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = medicos.filter(
    (m) =>
      m.nombre.toLowerCase().includes(search.toLowerCase()) ||
      m.especialidad.toLowerCase().includes(search.toLowerCase())
  );

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(medico: Medico) {
    onSelect(medico);
    setSearch("");
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <label
        htmlFor="doctor-selector"
        className="block text-sm font-medium text-text-muted mb-2"
      >
        Médico
      </label>

      {/* Input with search icon */}
      <div
        className="relative cursor-pointer"
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
      >
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
          {/* Search / Stethoscope SVG */}
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
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>

        <input
          ref={inputRef}
          id="doctor-selector"
          type="text"
          placeholder={
            selectedMedico
              ? `${selectedMedico.nombre} — ${selectedMedico.especialidad}`
              : "Buscar médico por nombre o especialidad..."
          }
          value={isOpen ? search : ""}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className={`w-full pl-10 pr-10 py-3.5 rounded-xl glass-light text-foreground placeholder:text-text-muted
            focus-ring transition-all duration-200 text-sm
            ${selectedMedico && !isOpen ? "placeholder:text-foreground/80" : ""}
          `}
          autoComplete="off"
        />

        {/* Chevron */}
        <div
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-transform duration-200 pointer-events-none ${
            isOpen ? "rotate-180" : ""
          }`}
        >
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
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Selected badge */}
      {selectedMedico && !isOpen && (
        <div className="mt-2 flex items-center gap-2 animate-fade-in">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              especialidadColors[selectedMedico.especialidad] ||
              "bg-primary/20 text-primary-light"
            }`}
          >
            {selectedMedico.especialidad}
          </span>
          <span className="text-xs text-text-muted">
            Consultorio {selectedMedico.consultorio}
          </span>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 mt-2 w-full max-h-72 overflow-y-auto rounded-xl glass border border-border-subtle
          shadow-2xl shadow-black/40 animate-scale-in"
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-text-muted text-sm">
              No se encontraron médicos
            </div>
          ) : (
            <ul role="listbox" className="py-1">
              {filtered.map((medico) => (
                <li
                  key={medico.id}
                  role="option"
                  aria-selected={selectedMedico?.id === medico.id}
                  onClick={() => handleSelect(medico)}
                  className={`flex items-center justify-between gap-3 px-4 py-3 cursor-pointer
                    transition-all duration-150 hover:bg-primary/10
                    ${
                      selectedMedico?.id === medico.id
                        ? "bg-primary/10 border-l-2 border-primary"
                        : "border-l-2 border-transparent"
                    }
                  `}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {medico.nombre}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      Consultorio {medico.consultorio}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
                      especialidadColors[medico.especialidad] ||
                      "bg-primary/20 text-primary-light"
                    }`}
                  >
                    {medico.especialidad}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
