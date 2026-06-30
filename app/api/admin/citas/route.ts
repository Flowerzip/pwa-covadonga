import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { checkIsAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await checkIsAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const searchTerm = searchParams.get("query")?.trim() ?? "";
    const medicoId = searchParams.get("medicoId")?.trim() ?? "";
    const estado = searchParams.get("estado")?.trim() ?? "";

    // Build query with optional filters
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (searchTerm) {
      conditions.push(
        `(c.nombre_paciente ILIKE $${paramIndex} OR c.telefono_paciente ILIKE $${paramIndex} OR c.motivo_consulta ILIKE $${paramIndex})`
      );
      params.push(`%${searchTerm}%`);
      paramIndex++;
    }

    if (medicoId) {
      conditions.push(`c.medico_id = $${paramIndex}`);
      params.push(parseInt(medicoId));
      paramIndex++;
    }

    if (estado) {
      conditions.push(`c.estado = $${paramIndex}`);
      params.push(estado);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const queryStr = `
      SELECT c.id, c.medico_id, c.nombre_paciente, c.telefono_paciente,
             c.motivo_consulta, c.fecha_hora_inicio, c.estado, c.recordatorio_enviado,
             m.nombre AS medico_nombre, m.especialidad AS medico_especialidad,
             m.consultorio AS medico_consultorio
      FROM citas c
      JOIN medicos m ON c.medico_id = m.id
      ${whereClause}
      ORDER BY c.fecha_hora_inicio DESC
    `;

    const citas = await query(queryStr, params);

    return NextResponse.json(citas);
  } catch (error) {
    console.error("Error al obtener citas en administración:", error);
    return NextResponse.json(
      { error: "Error interno al obtener citas." },
      { status: 500 }
    );
  }
}
