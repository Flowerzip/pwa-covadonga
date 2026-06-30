"use client";

import { useState } from "react";
import Image from "next/image";
import AppointmentForm from "@/components/AppointmentForm";
import MyAppointments from "@/components/MyAppointments";
import { ThemeToggle } from "@/components/ThemeProvider";
import Login from "@/components/Login";
import Register from "@/components/Register";
import AdminDashboard from "@/components/AdminDashboard";

import type { Cita } from "@/lib/types";

type View = "form" | "appointments";

export default function Home() {
  const [currentView, setCurrentView] = useState<View>("form");
  const [currentUser, setCurrentUser] = useState<{ name?: string; phone: string; es_admin?: boolean } | null>(null);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [editingCita, setEditingCita] = useState<Cita | null>(null);

  if (!currentUser) {
    return (
      <div className="flex flex-col flex-1 bg-mesh min-h-screen">
        {/* Header */}
        <header className="w-full px-4 sm:px-6 pt-5 pb-3 sm:pt-6 sm:pb-4 animate-fade-in">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Hospital Logo */}
              <div className="shrink-0 w-11 h-11 sm:w-13 sm:h-13 relative">
                <Image
                  src="/image.png"
                  alt="Hospital Covadonga Córdoba"
                  width={52}
                  height={52}
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-tight">
                  Hospital Covadonga
                </h1>
                <p className="text-[11px] sm:text-xs text-text-muted">
                  Córdoba · Reservación de Citas
                </p>
              </div>
            </div>

            {/* Right actions: theme toggle */}
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content (Auth Form) */}
        <main className="flex-1 w-full px-4 sm:px-6 py-8 flex items-center justify-center">
          {authView === "login" ? (
            <Login
              onLoginSuccess={(name, phone, esAdmin) => {
                setCurrentUser({ name, phone, es_admin: esAdmin });
              }}
              onSwitchToRegister={() => setAuthView("register")}
            />
          ) : (
            <Register
              onRegisterSuccess={(name, phone, esAdmin) => {
                setCurrentUser({ name, phone, es_admin: esAdmin });
              }}
              onSwitchToLogin={() => setAuthView("login")}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="w-full px-4 sm:px-6 py-4 sm:py-5 text-center animate-fade-in">
          <div className="max-w-xl mx-auto">
            <div className="border-t border-border-subtle pt-4">
              <p className="text-xs text-text-muted">
                Hospital Covadonga Córdoba — Sistema de Reservaciones
              </p>
              <p className="text-[11px] text-text-muted/60 mt-1">
                Av. Revolución 1234, Col. Centro · Tel: (555) 123-4567
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // If logged-in user is admin, mount AdminDashboard instead of patient views
  if (currentUser.es_admin) {
    return (
      <div className="flex flex-col flex-1 bg-mesh min-h-screen">
        {/* Header */}
        <header className="w-full px-4 sm:px-6 pt-5 pb-3 sm:pt-6 sm:pb-4 animate-fade-in">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Hospital Logo */}
              <div className="shrink-0 w-11 h-11 sm:w-13 sm:h-13 relative">
                <Image
                  src="/image.png"
                  alt="Hospital Covadonga Córdoba"
                  width={52}
                  height={52}
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-tight">
                  Hospital Covadonga
                </h1>
                <p className="text-[11px] sm:text-xs text-text-muted">
                  Córdoba · Panel de Control Administrativo
                </p>
              </div>
            </div>

            {/* Right actions: User context + Log out button + Theme toggle */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden xs:flex flex-col text-right">
                <span className="text-xs font-semibold text-foreground max-w-[150px] truncate">
                  {currentUser.name || "Administrador"}
                </span>
                <span className="text-[10px] text-text-muted">
                  Administrador
                </span>
              </div>
              <button
                onClick={() => setCurrentUser(null)}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                className="p-2.5 rounded-xl hover:bg-danger-light text-text-muted hover:text-danger transition-colors duration-200 cursor-pointer"
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
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Admin Dashboard Container */}
        <main className="flex-1 w-full px-4 sm:px-6 py-5 sm:py-6">
          <AdminDashboard currentUser={currentUser} onLogout={() => setCurrentUser(null)} />
        </main>

        {/* Footer */}
        <footer className="w-full px-4 sm:px-6 py-4 sm:py-5 text-center animate-fade-in">
          <div className="max-w-6xl mx-auto">
            <div className="border-t border-border-subtle pt-4">
              <p className="text-xs text-text-muted">
                Hospital Covadonga Córdoba — Sistema de Administración
              </p>
              <p className="text-[11px] text-text-muted/60 mt-1">
                Av. Revolución 1234, Col. Centro · Tel: (555) 123-4567
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-mesh min-h-screen">
      {/* Header */}
      <header className="w-full px-4 sm:px-6 pt-5 pb-3 sm:pt-6 sm:pb-4 animate-fade-in">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Hospital Logo */}
            <div className="shrink-0 w-11 h-11 sm:w-13 sm:h-13 relative">
              <Image
                src="/image.png"
                alt="Hospital Covadonga Córdoba"
                width={52}
                height={52}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-tight">
                Hospital Covadonga
              </h1>
              <p className="text-[11px] sm:text-xs text-text-muted">
                Córdoba · Reservación de Citas
              </p>
            </div>
          </div>

          {/* Right actions: User context + Log out button + Theme toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden xs:flex flex-col text-right">
              <span className="text-xs font-semibold text-foreground max-w-[120px] truncate">
                {currentUser.name || "Paciente"}
              </span>
              <span className="text-[10px] text-text-muted">
                {currentUser.phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")}
              </span>
            </div>
            <button
              onClick={() => setCurrentUser(null)}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="p-2.5 rounded-xl hover:bg-danger-light text-text-muted hover:text-danger transition-colors duration-200 cursor-pointer"
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
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <div className="w-full px-4 sm:px-6 animate-fade-in">
        <div className="max-w-xl mx-auto flex gap-1 p-1 rounded-xl bg-surface-light border border-border-subtle">
          <button
            type="button"
            onClick={() => setCurrentView("form")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer
              ${
                currentView === "form"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-muted hover:text-foreground hover:bg-surface-light"
              }
            `}
          >
            <span className="flex items-center justify-center gap-2">
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
                <line x1="12" x2="12" y1="14" y2="18" />
                <line x1="10" x2="14" y1="16" y2="16" />
              </svg>
              Agendar Cita
            </span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentView("appointments")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer
              ${
                currentView === "appointments"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-muted hover:text-foreground hover:bg-surface-light"
              }
            `}
          >
            <span className="flex items-center justify-center gap-2">
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
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                <path d="m9 14 2 2 4-4" />
              </svg>
              Mis Citas
            </span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 w-full px-4 sm:px-6 py-5 sm:py-6">
        {currentView === "form" ? (
          <div
            className="max-w-xl mx-auto glass rounded-2xl p-5 sm:p-7
            shadow-lg shadow-primary/5 dark:shadow-black/30 animate-slide-up"
          >
            {/* Card title */}
            <div className="mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-1">
                {editingCita ? "Editar Cita" : "Agenda tu Consulta"}
              </h2>
              <p className="text-xs sm:text-sm text-text-muted">
                {editingCita
                  ? "Modifica la fecha, hora o detalles de tu consulta"
                  : "Selecciona tu médico, fecha y hora preferida"}
              </p>
            </div>

            <AppointmentForm
              initialName={currentUser.name}
              initialPhone={currentUser.phone}
              editingCita={editingCita}
              onCancelEdit={() => {
                setEditingCita(null);
                setCurrentView("appointments");
              }}
              onSuccess={() => {
                setEditingCita(null);
                setCurrentView("appointments");
              }}
            />
          </div>
        ) : (
          <div className="max-w-xl mx-auto animate-slide-up">
            <MyAppointments
              onNewAppointment={() => {
                setEditingCita(null);
                setCurrentView("form");
              }}
              phoneFilter={currentUser.phone}
              onEditAppointment={(cita) => {
                setEditingCita(cita);
                setCurrentView("form");
              }}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full px-4 sm:px-6 py-4 sm:py-5 text-center animate-fade-in">
        <div className="max-w-xl mx-auto">
          <div className="border-t border-border-subtle pt-4">
            <p className="text-xs text-text-muted">
              Hospital Covadonga Córdoba — Sistema de Reservaciones
            </p>
            <p className="text-[11px] text-text-muted/60 mt-1">
              Av. Revolución 1234, Col. Centro · Tel: (555) 123-4567
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
