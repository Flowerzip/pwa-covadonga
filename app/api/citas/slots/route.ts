// GET /api/citas/slots?medicoId=X&fecha=YYYY-MM-DD
// Computes available 30-minute slots for a doctor on a given date
import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

interface HorarioRow {
  hora_inicio: string;
  hora_fin: string;
}

interface CitaRow {
  hora: string;
}

export async function GET(req: NextRequest) {
  try {
    const medicoId = req.nextUrl.searchParams.get("medicoId");
    const fecha = req.nextUrl.searchParams.get("fecha");

    if (!medicoId || !fecha) {
      return NextResponse.json(
        { error: "Parámetros 'medicoId' y 'fecha' son obligatorios." },
        { status: 400 }
      );
    }

    // Get the day of week (1=Monday ... 7=Sunday) for the given date
    const dateObj = new Date(fecha + "T00:00:00");
    const jsDay = dateObj.getDay(); // 0=Sun, 1=Mon...6=Sat
    const diaSemana = jsDay === 0 ? 7 : jsDay;

    // Get doctor schedule for that day
    const horario = await queryOne<HorarioRow>(
      `SELECT TO_CHAR(hora_inicio, 'HH24:MI') AS hora_inicio,
              TO_CHAR(hora_fin, 'HH24:MI') AS hora_fin
       FROM horarios_laborales
       WHERE medico_id = $1 AND dia_semana = $2`,
      [medicoId, diaSemana]
    );

    if (!horario) {
      // Doctor doesn't work this day
      return NextResponse.json([]);
    }

    // Get existing appointments for this doctor on this date
    const citasExistentes = await query<CitaRow>(
      `SELECT TO_CHAR(fecha_hora_inicio, 'HH24:MI') AS hora
       FROM citas
       WHERE medico_id = $1
         AND fecha_hora_inicio::date = $2::date
         AND estado != 'cancelada'`,
      [medicoId, fecha]
    );

    const occupiedTimes = new Set(citasExistentes.map((c) => c.hora));

    // Generate 30-minute slots
    const [startH, startM] = horario.hora_inicio.split(":").map(Number);
    const [endH, endM] = horario.hora_fin.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const slots: { time: string; available: boolean }[] = [];
    for (let m = startMinutes; m < endMinutes; m += 30) {
      const hh = String(Math.floor(m / 60)).padStart(2, "0");
      const mm = String(m % 60).padStart(2, "0");
      const timeStr = `${hh}:${mm}`;
      slots.push({
        time: timeStr,
        available: !occupiedTimes.has(timeStr),
      });
    }

    return NextResponse.json(slots);
  } catch (error) {
    console.error("Error al obtener slots:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
