// POST /api/auth/register
// Registers a new user and sends OTP code via SMS
import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { enviarCodigoOtp } from "@/lib/sms";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre, telefono } = body as { nombre?: string; telefono?: string };

    if (!nombre || !telefono || telefono.length !== 10) {
      return NextResponse.json(
        { error: "Nombre y teléfono (10 dígitos) son obligatorios." },
        { status: 400 }
      );
    }

    // Check if phone already registered
    const existing = await queryOne<{ id: string }>(
      "SELECT id FROM usuarios WHERE telefono = $1",
      [telefono]
    );
    if (existing) {
      return NextResponse.json(
        { error: "Este número de teléfono ya está registrado. Inicia sesión." },
        { status: 409 }
      );
    }

    // Generate 6-digit OTP
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiraEn = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in DB
    await query(
      `INSERT INTO codigos_otp (telefono, codigo, tipo, expira_en)
       VALUES ($1, $2, 'registro', $3)`,
      [telefono, codigo, expiraEn.toISOString()]
    );

    // Send SMS
    await enviarCodigoOtp(telefono, codigo, "registro");

    // Store name temporarily in the OTP record for later use during verify
    return NextResponse.json({
      success: true,
      message: "Código enviado. Revisa tus mensajes SMS.",
      nombre_temp: nombre, // Frontend stores this for the verify step
    });
  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
