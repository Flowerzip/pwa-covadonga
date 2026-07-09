// ============================================================
// Hospital Covadonga — SMS Service
// ============================================================

/**
 * Sends an SMS message.
 * @param telefono El número de teléfono (ej: "2711234567")
 * @param mensaje El contenido del mensaje
 */
export async function enviarSms(telefono: string, mensaje: string): Promise<boolean> {
  const mode = (process.env.SMS_MODE ?? "simulado").toLowerCase();

  // ── Bloque Twilio ──────────────────────────────────────────
  if (mode === "twilio") {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !from) {
      console.error("[SMS ERROR] Faltan variables de entorno de Twilio.");
      return false;
    }

    // Limpieza de formato: asegura E.164 (+52XXXXXXXXXX)
    const telefonoLimpio = telefono.startsWith('+') ? telefono : `+52${telefono}`;

    try {
      const twilio = (await import('twilio')).default;
      const client = twilio(accountSid, authToken);

      await client.messages.create({
        body: mensaje,
        from,
        to: telefonoLimpio
      });

      console.log(`[SMS TWILIO ENVIADO] → ${telefonoLimpio}`);
      return true;
    } catch (error) {
      console.error("[SMS TWILIO ERROR] Falló el envío del mensaje:", error);
      return false;
    }
  }
  // ── Fin bloque Twilio ──────────────────────────────────────

  // Modo simulado
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║           📱  SMS SIMULADO (No real)             ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(`║  Para: ${telefono.padEnd(41)}║`);
  console.log(`║  Mensaje: ${mensaje.substring(0, 38).padEnd(38)}║`);
  if (mensaje.length > 38) {
    console.log(`║           ${mensaje.substring(38, 76).padEnd(38)}║`);
  }
  console.log("╚══════════════════════════════════════════════════╝\n");

  return true;
}

/**
 * Sends an OTP code via SMS.
 */
export async function enviarCodigoOtp(telefono: string, codigo: string, tipo: "login" | "registro"): Promise<boolean> {
  const accion = tipo === "login" ? "inicio de sesión" : "registro";
  const mensaje = `Hospital Covadonga: Tu código de ${accion} es: ${codigo}. Válido por 10 minutos.`;
  return await enviarSms(telefono, mensaje);
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
  return await enviarSms(telefono, mensaje);
}