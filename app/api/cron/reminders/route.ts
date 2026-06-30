// GET /api/cron/reminders
// Scans for appointments starting in ~5 hours and sends SMS reminders.
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { enviarRecordatorio } from "@/lib/sms";

export async function GET() {
  try {
    // Query appointments starting between 4.5 and 5.5 hours from now
    // which have not yet had a reminder sent.
    interface CitaRecordatorio {
      id: number;
      nombre_paciente: string;
      telefono_paciente: string;
      fecha_hora_inicio: Date;
      medico_nombre: string;
      especialidad: string;
      consultorio: string;
    }

    const rows = await query<CitaRecordatorio>(
      `SELECT c.id, c.nombre_paciente, c.telefono_paciente, c.fecha_hora_inicio,
              m.nombre AS medico_nombre, m.especialidad, m.consultorio
       FROM citas c
       JOIN medicos m ON c.medico_id = m.id
       WHERE c.estado = 'confirmada'
         AND c.recordatorio_enviado = FALSE
         AND c.fecha_hora_inicio >= NOW() + INTERVAL '4 hours 30 minutes'
         AND c.fecha_hora_inicio <= NOW() + INTERVAL '5 hours 30 minutes'`
    );

    const sentIds: number[] = [];

    for (const cita of rows) {
      const fechaObj = new Date(cita.fecha_hora_inicio);
      
      // Formatear fecha y hora para el SMS
      const fechaStr = fechaObj.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
      });
      const horaStr = fechaObj.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      const success = await enviarRecordatorio(
        cita.telefono_paciente,
        cita.nombre_paciente,
        cita.medico_nombre,
        cita.especialidad,
        cita.consultorio,
        fechaStr,
        horaStr
      );

      if (success) {
        sentIds.push(cita.id);
      }
    }

    // Mark sent appointments as sent in the database
    if (sentIds.length > 0) {
      await query(
        `UPDATE citas 
         SET recordatorio_enviado = TRUE 
         WHERE id = ANY($1::int[])`,
        [sentIds]
      );
    }

    return NextResponse.json({
      success: true,
      remindersSent: sentIds.length,
      appointmentIds: sentIds,
    });
  } catch (error) {
    console.error("Error en cron de recordatorios:", error);
    return NextResponse.json(
      { error: "Error interno del servidor en cron." },
      { status: 500 }
    );
  }
}
