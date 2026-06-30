import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { checkIsAdmin } from "@/lib/admin-auth";

// POST /api/admin/medicos — Create a new doctor
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await checkIsAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const body = await req.json();
    const { nombre, especialidad, consultorio } = body as {
      nombre?: string;
      especialidad?: string;
      consultorio?: string;
    };

    if (!nombre || !especialidad || !consultorio) {
      return NextResponse.json(
        { error: "Nombre, especialidad y consultorio son obligatorios." },
        { status: 400 }
      );
    }

    // Insert doctor
    const rows = await query<{ id: number }>(
      `INSERT INTO medicos (nombre, especialidad, consultorio)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [nombre, especialidad, consultorio]
    );
    const newMedicoId = rows[0].id;

    // Seed default office hours (Mon-Fri = 1-5, 09:00 - 17:00)
    for (let day = 1; day <= 5; day++) {
      await query(
        `INSERT INTO horarios_laborales (medico_id, dia_semana, hora_inicio, hora_fin)
         VALUES ($1, $2, '09:00:00', '17:00:00')
         ON CONFLICT DO NOTHING`,
        [newMedicoId, day]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Médico registrado con éxito y horarios asignados.",
      id: newMedicoId,
    });
  } catch (error) {
    console.error("Error al registrar médico:", error);
    return NextResponse.json(
      { error: "Error interno al registrar médico." },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/medicos — Update doctor
export async function PATCH(req: NextRequest) {
  try {
    const isAdmin = await checkIsAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const body = await req.json();
    const { id, nombre, especialidad, consultorio } = body as {
      id?: number;
      nombre?: string;
      especialidad?: string;
      consultorio?: string;
    };

    if (!id) {
      return NextResponse.json(
        { error: "El ID del médico es obligatorio." },
        { status: 400 }
      );
    }

    // Retrieve doctor
    const doctor = await queryOne(
      "SELECT id FROM medicos WHERE id = $1",
      [id]
    );
    if (!doctor) {
      return NextResponse.json(
        { error: "El médico especificado no existe." },
        { status: 404 }
      );
    }

    // Resolve update
    const updNombre = nombre !== undefined ? nombre : null; // wait, dynamically build query
    const fieldsToSet: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (nombre !== undefined) {
      fieldsToSet.push(`nombre = $${paramIndex++}`);
      params.push(nombre);
    }
    if (especialidad !== undefined) {
      fieldsToSet.push(`especialidad = $${paramIndex++}`);
      params.push(especialidad);
    }
    if (consultorio !== undefined) {
      fieldsToSet.push(`consultorio = $${paramIndex++}`);
      params.push(consultorio);
    }

    if (fieldsToSet.length === 0) {
      return NextResponse.json(
        { error: "No se proporcionaron campos para actualizar." },
        { status: 400 }
      );
    }

    params.push(id);
    const queryStr = `UPDATE medicos SET ${fieldsToSet.join(", ")} WHERE id = $${paramIndex}`;
    await query(queryStr, params);

    return NextResponse.json({
      success: true,
      message: "Médico actualizado con éxito.",
    });
  } catch (error) {
    console.error("Error al actualizar médico:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar médico." },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/medicos — Delete doctor
export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await checkIsAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "El parámetro 'id' es obligatorio." },
        { status: 400 }
      );
    }

    // Check if doctor has active appointments
    const activeCita = await queryOne(
      "SELECT id FROM citas WHERE medico_id = $1 AND estado != 'cancelada' LIMIT 1",
      [parseInt(id)]
    );
    if (activeCita) {
      return NextResponse.json(
        { error: "No se puede eliminar al médico porque tiene citas activas asociadas. Por favor cancela las citas primero." },
        { status: 409 }
      );
    }

    // Delete horarios and doctor
    await query("DELETE FROM horarios_laborales WHERE medico_id = $1", [parseInt(id)]);
    await query("DELETE FROM medicos WHERE id = $1", [parseInt(id)]);

    return NextResponse.json({
      success: true,
      message: "Médico y sus horarios eliminados con éxito.",
    });
  } catch (error) {
    console.error("Error al eliminar médico:", error);
    return NextResponse.json(
      { error: "Error interno al eliminar médico." },
      { status: 500 }
    );
  }
}
