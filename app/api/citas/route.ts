// GET /api/citas?telefono=XXXXXXXXXX
// POST /api/citas — Create a new appointment
import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

/**
 * GET — List appointments for a given phone number.
 */
export async function GET(req: NextRequest) {
  try {
    const telefono = req.nextUrl.searchParams.get("telefono");

    if (!telefono) {
      return NextResponse.json(
        { error: "El parámetro 'telefono' es obligatorio." },
        { status: 400 }
      );
    }

    const citas = await query(
      `SELECT c.id, c.medico_id, c.nombre_paciente, c.telefono_paciente,
              c.motivo_consulta, c.fecha_hora_inicio, c.estado,
              m.nombre AS medico_nombre, m.especialidad AS medico_especialidad,
              m.consultorio AS medico_consultorio
       FROM citas c
       JOIN medicos m ON c.medico_id = m.id
       WHERE c.telefono_paciente = $1
       ORDER BY c.fecha_hora_inicio ASC`,
      [telefono]
    );

    return NextResponse.json(citas);
  } catch (error) {
    console.error("Error al obtener citas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

/**
 * POST — Create a new appointment.
 * Enforces UNIQUE(medico_id, fecha_hora_inicio) for non-cancelled.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { medico_id, nombre_paciente, telefono_paciente, motivo_consulta, fecha_hora_inicio } =
      body as {
        medico_id?: number;
        nombre_paciente?: string;
        telefono_paciente?: string;
        motivo_consulta?: string;
        fecha_hora_inicio?: string; // "YYYY-MM-DDTHH:mm"
      };

    // Validate required fields
    if (!medico_id || !nombre_paciente || !telefono_paciente || !motivo_consulta || !fecha_hora_inicio) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios." },
        { status: 400 }
      );
    }

    // Check for conflict (UNIQUE constraint)
    const conflict = await queryOne(
      `SELECT id FROM citas
       WHERE medico_id = $1 AND fecha_hora_inicio = $2 AND estado != 'cancelada'`,
      [medico_id, fecha_hora_inicio]
    );

    if (conflict) {
      // Suggest alternative slots
      const fecha = fecha_hora_inicio.split("T")[0];
      const available = await query<{ time: string }>(
        `WITH all_slots AS (
           SELECT TO_CHAR(generate_series(
             h.hora_inicio::time,
             h.hora_fin::time - interval '30 minutes',
             interval '30 minutes'
           ), 'HH24:MI') AS time
           FROM horarios_laborales h
           WHERE h.medico_id = $1
             AND h.dia_semana = EXTRACT(ISODOW FROM DATE $2)::int
         )
         SELECT s.time FROM all_slots s
         WHERE NOT EXISTS (
           SELECT 1 FROM citas c
           WHERE c.medico_id = $1
             AND c.fecha_hora_inicio = ($2 || 'T' || s.time)::timestamp with time zone
             AND c.estado != 'cancelada'
         )
         ORDER BY s.time
         LIMIT 3`,
        [medico_id, fecha]
      );

      return NextResponse.json(
        {
          error: "Este horario ya está ocupado por otro paciente.",
          suggestedSlots: available.map((r) => r.time),
        },
        { status: 409 }
      );
    }

    // Find the usuario_id if exists
    const usuario = await queryOne<{ id: string }>(
      "SELECT id FROM usuarios WHERE telefono = $1",
      [telefono_paciente]
    );

    // Create appointment
    const rows = await query(
      `INSERT INTO citas (medico_id, usuario_id, nombre_paciente, telefono_paciente, motivo_consulta, fecha_hora_inicio, estado)
       VALUES ($1, $2, $3, $4, $5, $6, 'confirmada')
       RETURNING id`,
      [medico_id, usuario?.id ?? null, nombre_paciente, telefono_paciente, motivo_consulta, fecha_hora_inicio]
    );

    return NextResponse.json({
      success: true,
      message: "¡Cita agendada exitosamente!",
      cita_id: (rows[0] as { id: number }).id,
    });
  } catch (error) {
    console.error("Error al crear cita:", error);
    // Handle the unique constraint violation from the DB as fallback
    const errMsg = (error as Error).message || "";
    if (errMsg.includes("uq_citas_medico_fecha_activo")) {
      return NextResponse.json(
        { error: "Este horario ya está ocupado por otro paciente." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

/**
 * PATCH — Edit or cancel an existing appointment.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      medico_id,
      nombre_paciente,
      telefono_paciente,
      motivo_consulta,
      fecha_hora_inicio,
      estado,
    } = body as {
      id?: number;
      medico_id?: number;
      nombre_paciente?: string;
      telefono_paciente?: string;
      motivo_consulta?: string;
      fecha_hora_inicio?: string; // "YYYY-MM-DDTHH:mm"
      estado?: string; // "confirmada" | "cancelada" | "pendiente"
    };

    if (!id) {
      return NextResponse.json(
        { error: "El ID de la cita es obligatorio." },
        { status: 400 }
      );
    }

    // Retrieve current appointment details
    interface CitaRecord {
      id: number;
      medico_id: number;
      usuario_id: string | null;
      nombre_paciente: string;
      telefono_paciente: string;
      motivo_consulta: string;
      fecha_hora_inicio: Date;
      estado: string;
    }

    const currentCita = await queryOne<CitaRecord>(
      `SELECT id, medico_id, usuario_id, nombre_paciente, telefono_paciente,
              motivo_consulta, fecha_hora_inicio, estado
       FROM citas WHERE id = $1`,
      [id]
    );

    if (!currentCita) {
      return NextResponse.json(
        { error: "La cita especificada no existe." },
        { status: 404 }
      );
    }

    // 1. Direct Cancellation optimization
    if (estado === "cancelada") {
      await query(
        "UPDATE citas SET estado = 'cancelada', recordatorio_enviado = FALSE WHERE id = $1",
        [id]
      );
      return NextResponse.json({
        success: true,
        message: "Cita cancelada exitosamente.",
      });
    }

    // Resolve updated fields (fallback to existing values)
    const updMedicoId = medico_id !== undefined ? medico_id : currentCita.medico_id;
    const updNombre = nombre_paciente !== undefined ? nombre_paciente : currentCita.nombre_paciente;
    const updTelefono = telefono_paciente !== undefined ? telefono_paciente : currentCita.telefono_paciente;
    const updMotivo = motivo_consulta !== undefined ? motivo_consulta : currentCita.motivo_consulta;
    const updFechaHora = fecha_hora_inicio !== undefined ? fecha_hora_inicio : currentCita.fecha_hora_inicio;
    const updEstado = estado !== undefined ? estado : currentCita.estado;

    // Resolve usuario_id if phone changed
    let updUsuarioId = currentCita.usuario_id;
    if (telefono_paciente !== undefined && telefono_paciente !== currentCita.telefono_paciente) {
      const usuario = await queryOne<{ id: string }>(
        "SELECT id FROM usuarios WHERE telefono = $1",
        [updTelefono]
      );
      updUsuarioId = usuario?.id ?? null;
    }

    // 2. Conflict validation (excluding the current appointment itself)
    if (medico_id !== undefined || fecha_hora_inicio !== undefined) {
      const conflict = await queryOne(
        `SELECT id FROM citas
         WHERE medico_id = $1 AND fecha_hora_inicio = $2 AND estado != 'cancelada' AND id != $3`,
        [updMedicoId, updFechaHora, id]
      );

      if (conflict) {
        // Suggest alternative slots for that doctor on that day
        const fechaStr = (typeof updFechaHora === "string" ? updFechaHora : updFechaHora.toISOString()).split("T")[0];
        const available = await query<{ time: string }>(
          `WITH all_slots AS (
             SELECT TO_CHAR(generate_series(
               h.hora_inicio::time,
               h.hora_fin::time - interval '30 minutes',
               interval '30 minutes'
             ), 'HH24:MI') AS time
             FROM horarios_laborales h
             WHERE h.medico_id = $1
               AND h.dia_semana = EXTRACT(ISODOW FROM DATE $2)::int
           )
           SELECT s.time FROM all_slots s
           WHERE NOT EXISTS (
             SELECT 1 FROM citas c
             WHERE c.medico_id = $1
               AND c.fecha_hora_inicio = ($2 || 'T' || s.time)::timestamp with time zone
               AND c.estado != 'cancelada'
               AND c.id != $3
           )
           ORDER BY s.time
           LIMIT 3`,
          [updMedicoId, fechaStr, id]
        );

        return NextResponse.json(
          {
            error: "Este horario ya está ocupado por otro paciente.",
            suggestedSlots: available.map((r) => r.time),
          },
          { status: 409 }
        );
      }
    }

    // 3. Update appointment
    await query(
      `UPDATE citas
       SET medico_id = $1, usuario_id = $2, nombre_paciente = $3, telefono_paciente = $4,
           motivo_consulta = $5, fecha_hora_inicio = $6, estado = $7, recordatorio_enviado = FALSE
       WHERE id = $8`,
      [updMedicoId, updUsuarioId, updNombre, updTelefono, updMotivo, updFechaHora, updEstado, id]
    );

    return NextResponse.json({
      success: true,
      message: "Cita actualizada exitosamente.",
    });
  } catch (error) {
    console.error("Error al actualizar cita:", error);
    const errMsg = (error as Error).message || "";
    if (errMsg.includes("uq_citas_medico_fecha_activo")) {
      return NextResponse.json(
        { error: "Este horario ya está ocupado por otro paciente." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Error interno del servidor al actualizar cita." },
      { status: 500 }
    );
  }
}
