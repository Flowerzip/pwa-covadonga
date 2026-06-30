// GET /api/medicos
// Returns all doctors from the database
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Medico } from "@/lib/types";

export async function GET() {
  try {
    const medicos = await query<Medico>(
      "SELECT id, nombre, especialidad, consultorio FROM medicos ORDER BY especialidad, nombre"
    );
    return NextResponse.json(medicos);
  } catch (error) {
    console.error("Error al obtener médicos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
