// POST /api/auth/login
// Sends OTP to an existing user's phone
import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { enviarCodigoOtp } from "@/lib/sms";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { telefono } = body as { telefono?: string };

    if (!telefono || telefono.length !== 10) {
      return NextResponse.json(
        { error: "Teléfono de 10 dígitos es obligatorio." },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await queryOne<{ id: string; nombre_completo: string }>(
      "SELECT id, nombre_completo FROM usuarios WHERE telefono = $1",
      [telefono]
    );
    if (!user) {
      return NextResponse.json(
        { error: "No existe una cuenta con este número. Regístrate primero." },
        { status: 404 }
      );
    }

    // Generate 6-digit OTP
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiraEn = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in DB
    await query(
      `INSERT INTO codigos_otp (telefono, codigo, tipo, expira_en)
       VALUES ($1, $2, 'login', $3)`,
      [telefono, codigo, expiraEn.toISOString()]
    );

    // Send SMS
    await enviarCodigoOtp(telefono, codigo, "login");

    return NextResponse.json({
      success: true,
      message: "Código enviado. Revisa tus mensajes SMS.",
    });
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
