import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { checkIsAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    // 1. Authorization check
    const isAdmin = await checkIsAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    // 2. Fetch total metrics
    const totalCitas = await queryOne<{ count: string }>(
      "SELECT COUNT(*)::text FROM citas"
    );
    const citasHoy = await queryOne<{ count: string }>(
      "SELECT COUNT(*)::text FROM citas WHERE fecha_hora_inicio::date = CURRENT_DATE AND estado != 'cancelada'"
    );
    const citasCanceladas = await queryOne<{ count: string }>(
      "SELECT COUNT(*)::text FROM citas WHERE estado = 'cancelada'"
    );
    const totalMedicos = await queryOne<{ count: string }>(
      "SELECT COUNT(*)::text FROM medicos"
    );
    const totalPacientes = await queryOne<{ count: string }>(
      "SELECT COUNT(*)::text FROM usuarios WHERE es_admin = FALSE"
    );

    // 3. Specialty Demand (Bar Chart Data)
    const citasPorEspecialidad = await query<{ label: string; value: number }>(
      `SELECT m.especialidad AS label, COUNT(c.id)::int AS value
       FROM citas c
       JOIN medicos m ON c.medico_id = m.id
       WHERE c.estado != 'cancelada'
       GROUP BY m.especialidad
       ORDER BY value DESC`
    );

    // 4. Daily Reservations Flow (Line Chart Data)
    // Map DOW (1-7) to day names. DOW 1=Monday ... 7=Sunday
    const citasPorDiaDb = await query<{ day_num: number; value: number }>(
      `SELECT EXTRACT(ISODOW FROM c.fecha_hora_inicio)::int AS day_num, COUNT(c.id)::int AS value
       FROM citas c
       WHERE c.estado != 'cancelada' AND c.fecha_hora_inicio >= NOW() - INTERVAL '7 days'
       GROUP BY day_num
       ORDER BY day_num ASC`
    );
    
    const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const citasPorDia = dayNames.map((name, index) => {
      const dbMatch = citasPorDiaDb.find((row) => row.day_num === index + 1);
      return {
        label: name,
        value: dbMatch ? dbMatch.value : 0,
      };
    });

    // 5. Status distribution (Doughnut Chart Data)
    const citasPorEstado = await query<{ label: string; value: number }>(
      `SELECT estado AS label, COUNT(id)::int AS value
       FROM citas
       GROUP BY estado`
    );

    return NextResponse.json({
      success: true,
      totals: {
        totalCitas: parseInt(totalCitas?.count ?? "0"),
        citasHoy: parseInt(citasHoy?.count ?? "0"),
        citasCanceladas: parseInt(citasCanceladas?.count ?? "0"),
        totalMedicos: parseInt(totalMedicos?.count ?? "0"),
        totalPacientes: parseInt(totalPacientes?.count ?? "0"),
      },
      charts: {
        especialidad: citasPorEspecialidad,
        dias: citasPorDia,
        estado: citasPorEstado,
      },
    });
  } catch (error) {
    console.error("Error al obtener estadísticas de administrador:", error);
    return NextResponse.json(
      { error: "Error interno al procesar estadísticas." },
      { status: 500 }
    );
  }
}
