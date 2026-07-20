// ============================================================
// Hospital Covadonga — SMS Service
// ============================================================

/**
 * Envía un SMS.
 * @param telefono Número de teléfono (ej: 2711234567)
 * @param mensaje Contenido del SMS
 */
export async function enviarSms(
  telefono: string,
  mensaje: string
): Promise<boolean> {

  const mode = (process.env.SMS_MODE ?? "simulado").toLowerCase();

  // ============================================================
  // MODO TWILIO
  // ============================================================
  if (mode === "twilio") {

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !from) {
      console.error("❌ [SMS ERROR] Faltan variables de entorno de Twilio.");
      return false;
    }

    // Convierte el teléfono al formato internacional
    const telefonoLimpio = telefono.startsWith("+")
      ? telefono
      : `+52${telefono}`;

    try {
      const twilio = (await import("twilio")).default;
      const client = twilio(accountSid, authToken);

      // ===========================
      // DEPURACIÓN
      // ===========================
      console.log("\n========================================");
      console.log("📤 ENVIANDO SMS CON TWILIO");
      console.log("Modo:", mode);
      console.log("SID:", accountSid);
      console.log("FROM:", from);
      console.log("TO:", telefonoLimpio);
      console.log("MENSAJE:", mensaje);
      console.log("========================================\n");

      const respuesta = await client.messages.create({
        body: mensaje,
        from,
        to: telefonoLimpio,
      });

      console.log("\n========================================");
      console.log("✅ SMS ENVIADO");
      console.log("SID:", respuesta.sid);
      console.log("Estado:", respuesta.status);
      console.log("Para:", telefonoLimpio);
      console.log("========================================\n");

      return true;

    } catch (error: any) {

      console.error("\n========================================");
      console.error("❌ ERROR DE TWILIO");
      console.error("Código:", error?.code);
      console.error("Mensaje:", error?.message);
      console.error("Más detalles:", error);
      console.error("========================================\n");

      return false;
    }
  }

  // ============================================================
  // MODO SIMULADO
  // ============================================================

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║           📱 SMS SIMULADO (No real)             ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(`║ Para: ${telefono.padEnd(42)}║`);
  console.log(`║ Mensaje: ${mensaje.substring(0, 38).padEnd(38)}║`);

  if (mensaje.length > 38) {
    console.log(`║          ${mensaje.substring(38, 76).padEnd(38)}║`);
  }

  console.log("╚══════════════════════════════════════════════════╝\n");

  return true;
}

/**
 * Envía un código OTP.
 */
export async function enviarCodigoOtp(
  telefono: string,
  codigo: string,
  tipo: "login" | "registro"
): Promise<boolean> {

  const accion =
    tipo === "login"
      ? "inicio de sesión"
      : "registro";

  const mensaje =
    `Hospital Covadonga: Tu código para ${accion} es ${codigo}. ` +
    `Es válido durante 10 minutos.`;

  return await enviarSms(telefono, mensaje);
}

/**
 * Envía un recordatorio de cita.
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
    `Hospital Covadonga: Hola ${nombrePaciente}. ` +
    `Le recordamos su cita con ${nombreMedico} (${especialidad}) ` +
    `el ${fecha} a las ${hora}. ` +
    `Consultorio ${consultorio}.`;

  return await enviarSms(telefono, mensaje);
}