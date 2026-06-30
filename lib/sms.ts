// ============================================================
// Hospital Covadonga — SMS Service
// Modo simulado: console.log | Modo twilio: envio real
// ============================================================

/**
 * Sends an SMS message.
 * In simulation mode, logs to the server console.
 * In production, would use Twilio or similar provider.
 */
export async function enviarSms(telefono: string, mensaje: string): Promise<boolean> {
  const mode = process.env.SMS_MODE ?? "simulado";

   //── Twilio (descomentar cuando se tenga cuenta de pago) ──────
  if (mode === "twilio") {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
     const authToken = process.env.TWILIO_AUTH_TOKEN;
     const from = process.env.TWILIO_PHONE_NUMBER;
  
     if (!accountSid || !authToken || !from) {
       console.error("[SMS ERROR] Faltan variables de entorno de Twilio.");
       return false;
     }
  
     try {
       const twilio = (await import('twilio')).default;
       const client = twilio(accountSid, authToken);
  
       await client.messages.create({
         body: mensaje,
         from,
         to: `+52${telefono}`
       });
  
       console.log(`[SMS TWILIO ENVIADO] → +52${telefono}`);
       return true;
     } catch (error) {
       console.error("[SMS TWILIO ERROR] Falló el envío del mensaje:", error);
       return false;
     }
   }
  // ── Fin bloque Twilio ──────────────────────────────────────────

  // Modo simulado
  console.log("");
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║           📱  SMS SIMULADO                      ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(`║  Para: ${telefono.padEnd(41)}║`);
  console.log(`║  Mensaje: ${mensaje.substring(0, 38).padEnd(38)}║`);
  if (mensaje.length > 38) {
    console.log(`║           ${mensaje.substring(38, 76).padEnd(38)}║`);
  }
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("");

  return true;
}

/**
 * Sends an OTP code via SMS.
 */
export async function enviarCodigoOtp(telefono: string, codigo: string, tipo: "login" | "registro"): Promise<boolean> {
  const accion = tipo === "login" ? "inicio de sesión" : "registro";
  const mensaje = `Hospital Covadonga: Tu código de ${accion} es: ${codigo}. Válido por 10 minutos.`;
  return enviarSms(telefono, mensaje);
}

/**
 * Sends an appointment reminder SMS.
 */
export async function enviarRecordatorio(
  telefono: string,
  nombrePaciente: string,
  nombreMedico: string,
  especialidad: string,
  consultorio: string,
  fecha: string,
  hora: string
): Promise<boolean> {
  const mensaje =
    `Hospital Covadonga: Recordatorio para ${nombrePaciente}. ` +
    `Tiene cita con ${nombreMedico} (${especialidad}) hoy a las ${hora} hrs, ` +
    `Consultorio ${consultorio}. Lo esperamos.`;
  return enviarSms(telefono, mensaje);
}
