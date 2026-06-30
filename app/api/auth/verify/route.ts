// POST /api/auth/verify
// Verifies OTP code and returns user data.
// For registration, creates the user in DB first.
import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import type { Usuario } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { telefono, codigo, tipo, nombre } = body as {
      telefono?: string;
      codigo?: string;
      tipo?: "login" | "registro";
      nombre?: string; // Only for registration
    };

    if (!telefono || !codigo || !tipo) {
      return NextResponse.json(
        { error: "Teléfono, código y tipo son obligatorios." },
        { status: 400 }
      );
    }

    // Find valid OTP
    const otp = await queryOne<{ id: number; codigo: string; expira_en: string }>(
      `SELECT id, codigo, expira_en FROM codigos_otp
       WHERE telefono = $1 AND tipo = $2 AND verificado = FALSE
       ORDER BY creado_en DESC LIMIT 1`,
      [telefono, tipo]
    );

    if (!otp) {
      return NextResponse.json(
        { error: "No se encontró un código pendiente. Solicita uno nuevo." },
        { status: 404 }
      );
    }

    // Check expiration
    if (new Date(otp.expira_en) < new Date()) {
      return NextResponse.json(
        { error: "El código ha expirado. Solicita uno nuevo." },
        { status: 410 }
      );
    }

    // Verify code
    if (otp.codigo !== codigo) {
      return NextResponse.json(
        { error: "El código ingresado es incorrecto." },
        { status: 401 }
      );
    }

    // Mark OTP as verified
    await query("UPDATE codigos_otp SET verificado = TRUE WHERE id = $1", [otp.id]);

    let user: Usuario | null = null;

    if (tipo === "registro") {
      // Create the user
      if (!nombre) {
        return NextResponse.json(
          { error: "El nombre es obligatorio para el registro." },
          { status: 400 }
        );
      }
      const rows = await query<Usuario>(
        `INSERT INTO usuarios (nombre_completo, telefono)
         VALUES ($1, $2)
         ON CONFLICT (telefono) DO UPDATE SET nombre_completo = EXCLUDED.nombre_completo
         RETURNING id, nombre_completo, telefono, es_admin`,
        [nombre, telefono]
      );
      user = rows[0];
    } else {
      // Login — fetch existing user
      user = await queryOne<Usuario>(
        "SELECT id, nombre_completo, telefono, es_admin FROM usuarios WHERE telefono = $1",
        [telefono]
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Error al obtener datos del usuario." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nombre: user.nombre_completo,
        telefono: user.telefono,
        es_admin: user.es_admin,
      },
    });
  } catch (error) {
    console.error("Error en verificación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
