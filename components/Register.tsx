"use client";

import { useState } from "react";

interface RegisterProps {
  onRegisterSuccess: (name: string, phone: string, esAdmin?: boolean) => void;
  onSwitchToLogin: () => void;
}

export default function Register({ onRegisterSuccess, onSwitchToLogin }: RegisterProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null);

  // Helper to format phone as 10 digits and only allow numbers
  function handlePhoneChange(val: string) {
    const numeric = val.replace(/\D/g, "");
    if (numeric.length <= 10) {
      setPhone(numeric);
      setError(null);
    }
  }

  // Helper to format OTP and restrict length to 6 digits
  function handleOtpChange(val: string) {
    const numeric = val.replace(/\D/g, "");
    if (numeric.length <= 6) {
      setOtp(numeric);
      setError(null);
    }
  }

  // Formats phone to (XXX) XXX-XXXX for readability
  function formatPhone(num: string) {
    if (num.length <= 3) return num;
    if (num.length <= 6) return `(${num.slice(0, 3)}) ${num.slice(3)}`;
    return `(${num.slice(0, 3)}) ${num.slice(3, 6)}-${num.slice(6, 10)}`;
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Por favor ingresa tu nombre completo.");
      return;
    }
    if (phone.length !== 10) {
      setError("Por favor ingresa un número de teléfono válido de 10 dígitos.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre: name, telefono: phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ocurrió un error al registrar.");
      }

      setStep(2);
      setSimulatedOtp("VER_CONSOLA");
    } catch (err: any) {
      setError(err.message || "Error de conexión.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 4 || otp.length > 6) {
      setError("El código de verificación debe tener entre 4 y 6 dígitos.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          telefono: phone,
          codigo: otp,
          tipo: "registro",
          nombre: name,
        }),
      });

      const text = await res.text();

console.log("Respuesta API:", text);

let data;

try {
  data = JSON.parse(text);
} catch (e) {
  throw new Error(`La API devolvió algo que no es JSON: ${text}`);
}

if (!res.ok) {
  throw new Error(data.error || "Ocurrió un error al registrar.");
}

      onRegisterSuccess(name, phone, data.user.es_admin);
    } catch (err: any) {
      setError(err.message || "Error de conexión.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleGoBack() {
    setStep(1);
    setOtp("");
    setError(null);
    setSimulatedOtp(null);
  }

  return (
    <div className="w-full max-w-xl mx-auto glass rounded-3xl p-6 sm:p-8 shadow-xl shadow-primary/5 dark:shadow-black/40 border border-border-subtle animate-slide-up">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-2">
          Registrar Cuenta
        </h2>
        <p className="text-sm sm:text-base text-text-muted">
          Regístrate para agendar y gestionar tus citas médicas
        </p>
      </div>

      {step === 1 ? (
        /* SCREEN 1: Name and Phone Entry */
        <form onSubmit={handleSendCode} className="space-y-6">
          {/* Full Name Input */}
          <div className="space-y-2">
            <label
              htmlFor="name-input"
              className="block text-base sm:text-lg font-bold text-foreground"
            >
              Nombre completo
            </label>
            <input
              id="name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="Ej: María García López"
              className={`w-full px-4 py-4 sm:py-5 rounded-2xl glass-light text-foreground text-base sm:text-lg font-medium
                placeholder:text-text-muted/40 focus-ring transition-all duration-200
                ${error && !name.trim() ? "ring-2 ring-danger/50" : ""}
              `}
              autoFocus
              required
            />
          </div>

          {/* Phone Number Input */}
          <div className="space-y-2">
            <label
              htmlFor="phone-input"
              className="block text-base sm:text-lg font-bold text-foreground"
            >
              Número de teléfono
            </label>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Ingresa tu número celular de 10 dígitos. Te enviaremos un código SMS gratuito para validar tu celular.
            </p>
            <div className="relative mt-2">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/60 pointer-events-none">
                <svg
                  width="22"
                  height="22"
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
                id="phone-input"
                type="tel"
                inputMode="numeric"
                value={formatPhone(phone)}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="Ej: 271 123 4567"
                className={`w-full pl-12 pr-4 py-4 sm:py-5 rounded-2xl glass-light text-foreground text-lg sm:text-xl font-medium
                  placeholder:text-text-muted/40 focus-ring transition-all duration-200 tracking-wide
                  ${error && phone.length !== 10 ? "ring-2 ring-danger/50" : ""}
                `}
                required
              />
            </div>
            <div className="flex justify-between items-center text-xs text-text-muted mt-1 px-1">
              <span>Formato: 10 dígitos</span>
              <span>{phone.length}/10 dígitos</span>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-danger-light border border-danger/20 p-4 animate-scale-in flex items-start gap-3">
              <span className="text-danger mt-0.5 shrink-0">
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
              </span>
              <p className="text-sm font-medium text-danger">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !name.trim() || phone.length !== 10}
            className={`w-full py-4 sm:py-5 px-6 rounded-2xl font-bold text-base sm:text-lg
              transition-all duration-200 relative overflow-hidden flex items-center justify-center gap-2
              ${
                isLoading || !name.trim() || phone.length !== 10
                  ? "bg-primary/45 text-white/60 cursor-not-allowed"
                  : "bg-primary text-white hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              }
            `}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
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
                Enviando código...
              </>
            ) : (
              <>
                <span>Enviar código</span>
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
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </form>
      ) : (
        /* SCREEN 2: OTP Verification */
        <form onSubmit={handleVerifyCode} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="otp-input"
              className="block text-base sm:text-lg font-bold text-foreground"
            >
              Código de verificación
            </label>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Ingresa el código que enviamos al número <strong className="text-foreground">{formatPhone(phone)}</strong>.
            </p>

            {/* Simulated SMS Notification Alert - Great for user experience */}
            {simulatedOtp && (
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 mt-2 mb-4 animate-scale-in">
                <div className="flex gap-3">
                  <div className="text-primary mt-0.5 shrink-0">
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
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-foreground">
                      Simulación de Envío SMS
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      Como estás en modo local, el código OTP se imprimió en la terminal del servidor (consola de Next.js). Por favor, búscalo e ingrésalo a continuación.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="relative mt-4">
              <input
                id="otp-input"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => handleOtpChange(e.target.value)}
                placeholder="000000"
                className={`w-full py-4 sm:py-5 rounded-2xl glass-light text-foreground text-center text-2xl sm:text-3xl font-bold tracking-[0.5em] pl-[0.5em]
                  placeholder:text-text-muted/20 focus-ring transition-all duration-200
                  ${error ? "ring-2 ring-danger/50" : ""}
                `}
                autoFocus
                required
              />
            </div>
            <div className="flex justify-between items-center text-xs text-text-muted mt-1 px-1">
              <span>Ingresa de 4 a 6 dígitos</span>
              <span>{otp.length} dígitos</span>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-danger-light border border-danger/20 p-4 animate-scale-in flex items-start gap-3">
              <span className="text-danger mt-0.5 shrink-0">
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
              </span>
              <p className="text-sm font-medium text-danger">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading || otp.length < 4}
              className={`w-full py-4 sm:py-5 px-6 rounded-2xl font-bold text-base sm:text-lg
                transition-all duration-200 relative overflow-hidden flex items-center justify-center gap-2
                ${
                  isLoading || otp.length < 4
                    ? "bg-primary/45 text-white/60 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                }
              `}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
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
                  Confirmando...
                </>
              ) : (
                <>
                  <span>Confirmar registro</span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleGoBack}
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-2xl font-semibold text-sm sm:text-base
                text-text-muted hover:text-foreground hover:bg-surface-light border border-transparent
                transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
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
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Regresar al paso anterior</span>
            </button>
          </div>
        </form>
      )}

      {/* Switch to Login link */}
      <div className="mt-8 pt-6 border-t border-border-subtle text-center">
        <p className="text-sm sm:text-base text-text-muted">
          ¿Ya tienes una cuenta registrada?
        </p>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="mt-2 text-primary dark:text-primary-light font-bold text-base sm:text-lg hover:underline cursor-pointer transition-all focus:outline-none"
        >
          Inicia sesión aquí
        </button>
      </div>
    </div>
  );
}
