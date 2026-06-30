"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { Medico, Cita, Usuario, Especialidad } from "@/lib/types";
import { BarChart, LineChart, DoughnutChart } from "./AdminCharts";
import AppointmentForm from "./AppointmentForm";

interface AdminDashboardProps {
  currentUser: { name?: string; phone: string; es_admin?: boolean };
  onLogout: () => void;
}

interface StatsData {
  totals: {
    totalCitas: number;
    citasHoy: number;
    citasCanceladas: number;
    totalMedicos: number;
    totalPacientes: number;
  };
  charts: {
    especialidad: { label: string; value: number }[];
    dias: { label: string; value: number }[];
    estado: { label: string; value: number }[];
  };
}

const ESPECIALIDADES: Especialidad[] = [
  "Alergología",
  "Algología",
  "Cardiología",
  "Dermatología",
  "Neurología",
  "Oftalmología",
  "Pediatría",
  "Traumatología",
];

export default function AdminDashboard({ currentUser, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"inicio" | "citas" | "medicos" | "pacientes">("inicio");
  
  // Data States
  const [stats, setStats] = useState<StatsData | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  
  // Loading & Error States
  const [statsLoading, setStatsLoading] = useState(false);
  const [citasLoading, setCitasLoading] = useState(false);
  const [medicosLoading, setMedicosLoading] = useState(false);
  const [usuariosLoading, setUsuariosLoading] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters for Appointments Tab
  const [citaSearch, setCitaSearch] = useState("");
  const [citaMedFilter, setCitaMedFilter] = useState("");
  const [citaEstFilter, setCitaEstFilter] = useState("");

  // Edit / Add Modal States
  const [editingCita, setEditingCita] = useState<Cita | null>(null);
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Medico | null>(null);
  
  // Doctor form fields
  const [docNombre, setDocNombre] = useState("");
  const [docEspecialidad, setDocEspecialidad] = useState<Especialidad>("Cardiología");
  const [docConsultorio, setDocConsultorio] = useState("");

  // Fetching Helpers
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { "x-user-phone": currentUser.phone },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al cargar las estadísticas.");
      }
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setStatsLoading(false);
    }
  }, [currentUser.phone]);

  const fetchCitas = useCallback(async () => {
    setCitasLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (citaSearch) queryParams.append("query", citaSearch);
      if (citaMedFilter) queryParams.append("medicoId", citaMedFilter);
      if (citaEstFilter) queryParams.append("estado", citaEstFilter);

      const res = await fetch(`/api/admin/citas?${queryParams.toString()}`, {
        headers: { "x-user-phone": currentUser.phone },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al obtener las citas.");
      }
      const data = await res.json();
      setCitas(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al cargar citas.");
    } finally {
      setCitasLoading(false);
    }
  }, [currentUser.phone, citaSearch, citaMedFilter, citaEstFilter]);

  const fetchMedicos = useCallback(async () => {
    setMedicosLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/medicos");
      if (!res.ok) {
        throw new Error("Error al obtener los médicos.");
      }
      const data = await res.json();
      setMedicos(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al cargar médicos.");
    } finally {
      setMedicosLoading(false);
    }
  }, []);

  const fetchUsuarios = useCallback(async () => {
    setUsuariosLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/usuarios", {
        headers: { "x-user-phone": currentUser.phone },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al obtener los usuarios.");
      }
      const data = await res.json();
      setUsuarios(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al cargar pacientes.");
    } finally {
      setUsuariosLoading(false);
    }
  }, [currentUser.phone]);

  // Load appropriate data on tab changes
  useEffect(() => {
    if (activeTab === "inicio") {
      fetchStats();
    } else if (activeTab === "citas") {
      fetchCitas();
      fetchMedicos(); // to fill filters
    } else if (activeTab === "medicos") {
      fetchMedicos();
    } else if (activeTab === "pacientes") {
      fetchUsuarios();
    }
  }, [activeTab, fetchStats, fetchCitas, fetchMedicos, fetchUsuarios]);

  // Handle auto-refresh of stats when filters are applied (debounce/trigger fetch)
  useEffect(() => {
    if (activeTab === "citas") {
      fetchCitas();
    }
  }, [citaSearch, citaMedFilter, citaEstFilter, activeTab, fetchCitas]);

  // Appointment Actions
  const handleCancelCita = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas cancelar esta cita? La cita se deshabilitará pero permanecerá registrada con la indicación 'Cancelada'.")) {
      return;
    }
    setOperationLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/citas", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, estado: "cancelada" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo cancelar la cita.");
      }
      setSuccessMsg("Cita cancelada con éxito.");
      fetchCitas();
    } catch (err: any) {
      setError(err.message || "Error de red al cancelar cita.");
    } finally {
      setOperationLoading(false);
    }
  };

  // Doctor Modal / Actions
  const openDoctorModal = (doc: Medico | null = null) => {
    setEditingDoctor(doc);
    if (doc) {
      setDocNombre(doc.nombre);
      setDocEspecialidad(doc.especialidad);
      setDocConsultorio(doc.consultorio);
    } else {
      setDocNombre("");
      setDocEspecialidad("Cardiología");
      setDocConsultorio("");
    }
    setDoctorModalOpen(true);
  };

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNombre.trim() || !docConsultorio.trim()) {
      alert("Por favor rellene todos los campos obligatorios.");
      return;
    }

    setOperationLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const isEdit = !!editingDoctor;
      const url = "/api/admin/medicos";
      const method = isEdit ? "PATCH" : "POST";
      const body = {
        ...(isEdit ? { id: editingDoctor.id } : {}),
        nombre: docNombre.trim(),
        especialidad: docEspecialidad,
        consultorio: docConsultorio.trim(),
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-phone": currentUser.phone,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo procesar la solicitud de médico.");
      }

      setSuccessMsg(isEdit ? "Médico actualizado con éxito." : "Médico registrado con éxito.");
      setDoctorModalOpen(false);
      fetchMedicos();
    } catch (err: any) {
      setError(err.message || "Error al procesar médico.");
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeleteDoctor = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este médico? Esto fallará si el médico tiene citas pendientes activas.")) {
      return;
    }

    setOperationLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/medicos?id=${id}`, {
        method: "DELETE",
        headers: { "x-user-phone": currentUser.phone },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo eliminar al médico.");
      }
      setSuccessMsg("Médico eliminado correctamente.");
      fetchMedicos();
    } catch (err: any) {
      setError(err.message || "Error al eliminar médico.");
    } finally {
      setOperationLoading(false);
    }
  };

  // User Actions (Pacientes / Admins)
  const handleToggleAdmin = async (userId: string, currentEsAdmin: boolean) => {
    const actionName = currentEsAdmin ? "quitar permisos de administrador" : "otorgar permisos de administrador";
    if (!confirm(`¿Estás seguro de que deseas ${actionName} a este usuario?`)) {
      return;
    }

    setOperationLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-phone": currentUser.phone,
        },
        body: JSON.stringify({ id: userId, es_admin: !currentEsAdmin }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo actualizar el rol de usuario.");
      }
      setSuccessMsg("Rol de usuario actualizado con éxito.");
      fetchUsuarios();
    } catch (err: any) {
      setError(err.message || "Error al actualizar rol de usuario.");
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar la cuenta de este usuario? Sus citas asociadas serán desvinculadas.")) {
      return;
    }

    setOperationLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/usuarios?id=${userId}`, {
        method: "DELETE",
        headers: { "x-user-phone": currentUser.phone },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo eliminar el usuario.");
      }
      setSuccessMsg("Usuario eliminado con éxito.");
      fetchUsuarios();
    } catch (err: any) {
      setError(err.message || "Error al eliminar usuario.");
    } finally {
      setOperationLoading(false);
    }
  };

  // Helper date formatter
  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("es-MX", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Messages */}
      {error && (
        <div className="rounded-xl bg-danger-light border border-danger/20 p-4 animate-scale-in flex items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-danger mt-0.5 shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
            </span>
            <p className="text-sm font-semibold text-danger">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-danger hover:opacity-85 text-xs font-bold cursor-pointer">
            Cerrar
          </button>
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl bg-success-light border border-success/20 p-4 animate-scale-in flex items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-success mt-0.5 shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <p className="text-sm font-semibold text-success">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-success hover:opacity-85 text-xs font-bold cursor-pointer">
            Cerrar
          </button>
        </div>
      )}

      {/* Navigation Sub-menu */}
      <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-surface-light border border-border-subtle">
        <button
          onClick={() => setActiveTab("inicio")}
          className={`flex-1 min-w-[90px] py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer
            ${activeTab === "inicio" ? "bg-primary text-white shadow" : "text-text-muted hover:text-foreground hover:bg-surface-light"}`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
            Inicio
          </span>
        </button>
        
        <button
          onClick={() => setActiveTab("citas")}
          className={`flex-1 min-w-[90px] py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer
            ${activeTab === "citas" ? "bg-primary text-white shadow" : "text-text-muted hover:text-foreground hover:bg-surface-light"}`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
            Citas
          </span>
        </button>

        <button
          onClick={() => setActiveTab("medicos")}
          className={`flex-1 min-w-[90px] py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer
            ${activeTab === "medicos" ? "bg-primary text-white shadow" : "text-text-muted hover:text-foreground hover:bg-surface-light"}`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4.8 2.3h14.4c.5 0 .9.4.9.9v17.6c0 .5-.4.9-.9.9H4.8a.9.9 0 0 1-.9-.9V3.2c0-.5.4-.9.9-.9z" />
              <path d="M10 9h4" />
              <path d="M12 7v4" />
            </svg>
            Médicos
          </span>
        </button>

        <button
          onClick={() => setActiveTab("pacientes")}
          className={`flex-1 min-w-[90px] py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer
            ${activeTab === "pacientes" ? "bg-primary text-white shadow" : "text-text-muted hover:text-foreground hover:bg-surface-light"}`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Pacientes
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="glass rounded-2xl p-5 sm:p-7 shadow-lg">
        {/* ========================================================
            TAB 1: INICIO (Estadísticas y Métricas)
            ======================================================== */}
        {activeTab === "inicio" && (
          <div className="space-y-8 animate-slide-up">
            <div>
              <h2 className="text-xl font-bold text-foreground">Panel de Inicio</h2>
              <p className="text-sm text-text-muted">Resumen ejecutivo y flujo de demanda actual</p>
            </div>

            {statsLoading && !stats ? (
              <div className="flex h-64 items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                </svg>
              </div>
            ) : (
              stats && (
                <>
                  {/* Metric Cards Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Card 1 */}
                    <div className="glass-light p-4 rounded-xl space-y-1 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-200">
                      <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Total Citas</span>
                      <p className="text-2xl sm:text-3xl font-black text-foreground">{stats.totals.totalCitas}</p>
                      <div className="absolute right-2 bottom-2 text-primary/10 group-hover:text-primary/15 transition-colors">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect width="18" height="18" x="3" y="4" rx="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                      </div>
                    </div>
                    {/* Card 2 */}
                    <div className="glass-light p-4 rounded-xl space-y-1 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-200">
                      <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Citas Hoy</span>
                      <p className="text-2xl sm:text-3xl font-black text-success">{stats.totals.citasHoy}</p>
                      <div className="absolute right-2 bottom-2 text-success/10 group-hover:text-success/15 transition-colors">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                    </div>
                    {/* Card 3 */}
                    <div className="glass-light p-4 rounded-xl space-y-1 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-200">
                      <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Canceladas</span>
                      <p className="text-2xl sm:text-3xl font-black text-danger">{stats.totals.citasCanceladas}</p>
                      <div className="absolute right-2 bottom-2 text-danger/10 group-hover:text-danger/15 transition-colors">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                      </div>
                    </div>
                    {/* Card 4 */}
                    <div className="glass-light p-4 rounded-xl space-y-1 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-200">
                      <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Médicos</span>
                      <p className="text-2xl sm:text-3xl font-black text-foreground">{stats.totals.totalMedicos}</p>
                      <div className="absolute right-2 bottom-2 text-primary/10 group-hover:text-primary/15 transition-colors">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M4.8 2.3h14.4c.5 0 .9.4.9.9v17.6c0 .5-.4.9-.9.9H4.8a.9.9 0 0 1-.9-.9V3.2c0-.5.4-.9.9-.9z" />
                        </svg>
                      </div>
                    </div>
                    {/* Card 5 */}
                    <div className="glass-light p-4 rounded-xl space-y-1 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-200">
                      <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Pacientes</span>
                      <p className="text-2xl sm:text-3xl font-black text-foreground">{stats.totals.totalPacientes}</p>
                      <div className="absolute right-2 bottom-2 text-primary/10 group-hover:text-primary/15 transition-colors">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    {/* Specialty Demands */}
                    <div className="glass-light p-5 rounded-xl border border-border-subtle space-y-4">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                        Citas por Especialidad
                      </h3>
                      <BarChart data={stats.charts.especialidad} />
                    </div>

                    {/* Weekly Reservations */}
                    <div className="glass-light p-5 rounded-xl border border-border-subtle space-y-4">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                        Flujo de Reservaciones (Últimos 7 Días)
                      </h3>
                      <LineChart data={stats.charts.dias} />
                    </div>

                    {/* Status Distribution */}
                    <div className="glass-light p-5 rounded-xl border border-border-subtle space-y-4 md:col-span-2">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                        Distribución de Citas por Estado
                      </h3>
                      <DoughnutChart data={stats.charts.estado} />
                    </div>
                  </div>
                </>
              )
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: CITAS (Listado y CRUD Citas)
            ======================================================== */}
        {activeTab === "citas" && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Gestión de Citas</h2>
                <p className="text-sm text-text-muted">Consulta, filtra, edita o cancela citas</p>
              </div>
              <button
                onClick={() => {
                  setEditingCita(null);
                  // Trigger a special add appointment state
                  // Since we have AppointmentForm, we can just open it in a modal
                  const emptyCitaDummy: Cita = {
                    id: 0,
                    medico_id: 0,
                    nombre_paciente: "",
                    telefono_paciente: "",
                    motivo_consulta: "",
                    fecha_hora_inicio: "",
                    estado: "confirmada"
                  };
                  setEditingCita(emptyCitaDummy);
                }}
                className="py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/10"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Agendar Nueva Cita
              </button>
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl glass-light border border-border-subtle">
              {/* Search */}
              <div className="relative sm:col-span-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60 pointer-events-none">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Buscar paciente, teléfono, motivo..."
                  value={citaSearch}
                  onChange={(e) => setCitaSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface border border-border-subtle text-foreground text-sm focus-ring transition-all placeholder:text-text-muted/50"
                />
              </div>

              {/* Medico Filter */}
              <div>
                <select
                  value={citaMedFilter}
                  onChange={(e) => setCitaMedFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-foreground text-sm focus-ring transition-all"
                >
                  <option value="">Todos los Médicos</option>
                  {medicos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} ({m.especialidad})
                    </option>
                  ))}
                </select>
              </div>

              {/* Estado Filter */}
              <div>
                <select
                  value={citaEstFilter}
                  onChange={(e) => setCitaEstFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-foreground text-sm focus-ring transition-all"
                >
                  <option value="">Todos los Estados</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
            </div>

            {/* List/Table of Citas */}
            {citasLoading && citas.length === 0 ? (
              <div className="flex h-48 items-center justify-center">
                <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                </svg>
              </div>
            ) : citas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 glass-light rounded-xl">
                <div className="text-text-muted/30">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-foreground">No se encontraron citas</h3>
                <p className="text-xs text-text-muted max-w-[280px]">Prueba a cambiar tus términos de búsqueda o filtros.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-border-subtle rounded-xl">
                <table className="w-full text-left border-collapse bg-surface-light/30">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface-light">
                      <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider">Paciente</th>
                      <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider">Fecha / Hora</th>
                      <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider">Médico</th>
                      <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider">Motivo</th>
                      <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider">Estado</th>
                      <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {citas.map((cita) => {
                      const isCancelled = cita.estado === "cancelada";
                      return (
                        <tr
                          key={cita.id}
                          className={`hover:bg-foreground/[0.01] transition-colors ${isCancelled ? "opacity-60" : ""}`}
                        >
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className={`text-sm font-semibold ${isCancelled ? "line-through text-text-muted" : "text-foreground"}`}>
                                {cita.nombre_paciente}
                              </span>
                              <span className="text-[11px] text-text-muted mt-0.5">
                                {cita.telefono_paciente.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-xs font-medium text-foreground">
                              {formatDateTime(cita.fecha_hora_inicio)}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-foreground">{cita.medico_nombre}</span>
                              <span className="text-[10px] text-text-muted mt-0.5">
                                {cita.medico_especialidad} · {cita.medico_consultorio}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 max-w-[160px] truncate" title={cita.motivo_consulta}>
                            <span className="text-xs text-text-muted">{cita.motivo_consulta}</span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                                ${
                                  cita.estado === "confirmada"
                                    ? "bg-success-light text-success"
                                    : cita.estado === "pendiente"
                                    ? "bg-primary-light/10 text-primary-light dark:text-accent-light"
                                    : "bg-danger-light text-danger"
                                }
                              `}
                            >
                              {cita.estado === "confirmada"
                                ? "Confirmada"
                                : cita.estado === "pendiente"
                                ? "Pendiente"
                                : "Cancelada"}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Edit Button */}
                              {!isCancelled && (
                                <button
                                  onClick={() => setEditingCita(cita)}
                                  title="Editar cita"
                                  className="p-2 rounded-lg hover:bg-surface-light border border-transparent hover:border-border-subtle text-text-muted hover:text-foreground cursor-pointer transition-colors duration-200"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                              )}

                              {/* Cancel Button */}
                              {!isCancelled && (
                                <button
                                  onClick={() => handleCancelCita(cita.id)}
                                  disabled={operationLoading}
                                  title="Cancelar cita"
                                  className="p-2 rounded-lg hover:bg-danger-light border border-transparent hover:border-danger/10 text-text-muted hover:text-danger cursor-pointer transition-colors duration-200 disabled:opacity-50"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 3: MÉDICOS (Listado y CRUD Médicos)
            ======================================================== */}
        {activeTab === "medicos" && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Gestión de Médicos</h2>
                <p className="text-sm text-text-muted">Da de alta, edita o elimina médicos y sus consultorios</p>
              </div>
              <button
                onClick={() => openDoctorModal(null)}
                className="py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/10"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Registrar Nuevo Médico
              </button>
            </div>

            {/* List/Table of Medicos */}
            {medicosLoading && medicos.length === 0 ? (
              <div className="flex h-48 items-center justify-center">
                <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                </svg>
              </div>
            ) : medicos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 glass-light rounded-xl">
                <div className="text-text-muted/30">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect width="18" height="18" x="3" y="4" rx="2" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-foreground">No hay médicos registrados</h3>
                <p className="text-xs text-text-muted max-w-[280px]">Utiliza el botón superior para dar de alta a un médico.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-border-subtle rounded-xl">
                <table className="w-full text-left border-collapse bg-surface-light/30">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface-light">
                      <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider">Nombre del Médico</th>
                      <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider">Especialidad</th>
                      <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider">Consultorio / Área</th>
                      <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {medicos.map((med) => (
                      <tr key={med.id} className="hover:bg-foreground/[0.01] transition-colors">
                        <td className="p-4">
                          <span className="text-sm font-semibold text-foreground">{med.nombre}</span>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">
                            {med.especialidad}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs text-foreground font-semibold">{med.consultorio}</span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Edit Button */}
                            <button
                              onClick={() => openDoctorModal(med)}
                              title="Editar datos del médico"
                              className="p-2 rounded-lg hover:bg-surface-light border border-transparent hover:border-border-subtle text-text-muted hover:text-foreground cursor-pointer transition-colors duration-200"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteDoctor(med.id)}
                              disabled={operationLoading}
                              title="Eliminar médico"
                              className="p-2 rounded-lg hover:bg-danger-light border border-transparent hover:border-danger/10 text-text-muted hover:text-danger cursor-pointer transition-colors duration-200 disabled:opacity-50"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 4: PACIENTES / USUARIOS (Listado de Usuarios)
            ======================================================== */}
        {activeTab === "pacientes" && (
          <div className="space-y-6 animate-slide-up">
            <div>
              <h2 className="text-xl font-bold text-foreground">Directorio de Usuarios</h2>
              <p className="text-sm text-text-muted">Visualiza los usuarios registrados y gestiona los privilegios de administrador</p>
            </div>

            {/* List/Table of Pacientes */}
            {usuariosLoading && usuarios.length === 0 ? (
              <div className="flex h-48 items-center justify-center">
                <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                </svg>
              </div>
            ) : usuarios.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 glass-light rounded-xl">
                <div className="text-text-muted/30">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-foreground">No hay usuarios registrados</h3>
                <p className="text-xs text-text-muted">Aún no se ha registrado ningún paciente en el sistema.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-border-subtle rounded-xl">
                <table className="w-full text-left border-collapse bg-surface-light/30">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface-light">
                      <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider">Nombre Completo</th>
                      <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider">Teléfono</th>
                      <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider">Rol</th>
                      <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider">Fecha Registro</th>
                      <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {usuarios.map((user) => {
                      const isCaller = user.telefono === currentUser.phone;
                      return (
                        <tr key={user.id} className="hover:bg-foreground/[0.01] transition-colors">
                          <td className="p-4">
                            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                              {user.nombre_completo}
                              {isCaller && (
                                <span className="text-[10px] bg-primary/20 text-primary-dark dark:bg-primary-light/20 dark:text-primary-light px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                                  Tú
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-xs text-foreground font-mono">
                              {user.telefono.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                                ${user.es_admin ? "bg-primary text-white shadow-sm" : "bg-surface text-text-muted border border-border-subtle"}`}
                            >
                              {user.es_admin ? "Administrador" : "Paciente"}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-xs text-text-muted">
                              {user.creado_en ? new Date(user.creado_en).toLocaleDateString("es-MX") : "N/A"}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Toggle Admin Privileges */}
                              <button
                                onClick={() => handleToggleAdmin(user.id, !!user.es_admin)}
                                disabled={isCaller || operationLoading}
                                title={user.es_admin ? "Quitar rol administrador" : "Hacer administrador"}
                                className={`p-2 rounded-lg border border-transparent hover:border-border-subtle cursor-pointer transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed
                                  ${user.es_admin ? "text-primary hover:bg-primary/10" : "text-text-muted hover:bg-surface-light hover:text-foreground"}`}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={isCaller || operationLoading}
                                title="Eliminar usuario"
                                className="p-2 rounded-lg hover:bg-danger-light border border-transparent hover:border-danger/10 text-text-muted hover:text-danger cursor-pointer transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL: EDITAR / REGISTRAR CITA
          ======================================================== */}
      {editingCita && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl glass rounded-2xl p-6 shadow-2xl max-h-[90vh] min-h-[600px] overflow-y-auto animate-scale-in flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-subtle">
              <h3 className="text-lg font-bold text-foreground">
                {editingCita.id > 0 ? "Modificar Cita Médica" : "Agendar Nueva Cita"}
              </h3>
              <button
                onClick={() => setEditingCita(null)}
                className="p-1 rounded-lg text-text-muted hover:text-foreground hover:bg-surface-light cursor-pointer transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Body: Render standard AppointmentForm */}
            <div className="flex-1">
              <AppointmentForm
                initialName={editingCita.id > 0 ? editingCita.nombre_paciente : ""}
                initialPhone={editingCita.id > 0 ? editingCita.telefono_paciente : ""}
                editingCita={editingCita.id > 0 ? editingCita : null}
                onCancelEdit={() => setEditingCita(null)}
                onSuccess={() => {
                  setEditingCita(null);
                  setSuccessMsg(editingCita.id > 0 ? "Cita actualizada con éxito." : "Cita creada con éxito.");
                  fetchCitas();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDITAR / REGISTRAR MÉDICO
          ======================================================== */}
      {doctorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md glass rounded-2xl p-6 shadow-2xl animate-scale-in">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-border-subtle">
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                {editingDoctor ? "Modificar Datos del Médico" : "Registrar Nuevo Médico"}
              </h3>
              <button
                onClick={() => setDoctorModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-foreground hover:bg-surface-light cursor-pointer transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Body: Form */}
            <form onSubmit={handleDoctorSubmit} className="space-y-4">
              {/* Doctor Name */}
              <div>
                <label htmlFor="doc-nombre" className="block text-sm font-semibold text-text-muted mb-2">
                  Nombre Completo
                </label>
                <input
                  id="doc-nombre"
                  type="text"
                  required
                  placeholder="Dr. Héctor Manuel"
                  value={docNombre}
                  onChange={(e) => setDocNombre(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-light/50 border border-border-subtle text-foreground text-sm focus-ring transition-all placeholder:text-text-muted/40"
                />
              </div>

              {/* Doctor Specialty */}
              <div>
                <label htmlFor="doc-especialidad" className="block text-sm font-semibold text-text-muted mb-2">
                  Especialidad Médica
                </label>
                <select
                  id="doc-especialidad"
                  value={docEspecialidad}
                  onChange={(e) => setDocEspecialidad(e.target.value as Especialidad)}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border-subtle text-foreground text-sm focus-ring transition-all"
                >
                  {ESPECIALIDADES.map((esp) => (
                    <option key={esp} value={esp}>
                      {esp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Consultorio */}
              <div>
                <label htmlFor="doc-consultorio" className="block text-sm font-semibold text-text-muted mb-2">
                  Consultorio / Consultor / Ubicación
                </label>
                <input
                  id="doc-consultorio"
                  type="text"
                  required
                  placeholder="Consultorio 104 · Planta Alta"
                  value={docConsultorio}
                  onChange={(e) => setDocConsultorio(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-light/50 border border-border-subtle text-foreground text-sm focus-ring transition-all placeholder:text-text-muted/40"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setDoctorModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-surface-light text-text-muted hover:text-foreground hover:bg-surface border border-border-subtle font-semibold text-xs sm:text-sm transition-all cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={operationLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {operationLoading ? "Guardando..." : "Guardar Médico"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
