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
        { error: "El teléfono debe contener 10 dígitos." },
        { status: 400 }
      );
    }

    console.log("====================================");
    console.log("📱 Teléfono recibido:", telefono);
    console.log("====================================");

    // Buscar usuario
    const user = await queryOne<{
      id: string;
      nombre_completo: string;
    }>(
      `SELECT id, nombre_completo
       FROM usuarios
       WHERE telefono = $1`,
      [telefono]
    );

    if (!user) {
      return NextResponse.json(
        {
          error:
            "No existe una cuenta registrada con este número."
        },
        { status: 404 }
      );
    }

    // Generar OTP
    const codigo = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const expiraEn = new Date(
      Date.now() + 10 * 60 * 1000
    );

    console.log("Código OTP:", codigo);

    // Guardar OTP
    await query(
      `INSERT INTO codigos_otp
      (telefono, codigo, tipo, expira_en)
      VALUES ($1,$2,'login',$3)`,
      [telefono, codigo, expiraEn.toISOString()]
    );

    // Enviar SMS
    const enviado = await enviarCodigoOtp(
      telefono,
      codigo,
      "login"
    );

    if (!enviado) {
      return NextResponse.json(
        {
          error:
            "Twilio no pudo enviar el SMS."
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Código enviado correctamente."
    });

  } catch (error) {

    console.error("=========== LOGIN ERROR ===========");
    console.error(error);
    console.error("===================================");

    return NextResponse.json(
      {
        error: "Error interno del servidor."
      },
      { status: 500 }
    );
  }
}