import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { checkIsAdmin } from "@/lib/admin-auth";
import type { Usuario } from "@/lib/types";

// GET /api/admin/usuarios — Lists all users
export async function GET(req: NextRequest) {
  try {
    const isAdmin = await checkIsAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const usuarios = await query<Usuario>(
      "SELECT id, nombre_completo, telefono, es_admin, creado_en FROM usuarios ORDER BY creado_en DESC"
    );

    return NextResponse.json(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json(
      { error: "Error interno al obtener usuarios." },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/usuarios — Update user es_admin role
export async function PATCH(req: NextRequest) {
  try {
    const isAdmin = await checkIsAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const callerPhone = req.headers.get("x-user-phone");
    const body = await req.json();
    const { id, es_admin } = body as { id?: string; es_admin?: boolean };

    if (!id || es_admin === undefined) {
      return NextResponse.json(
        { error: "El ID de usuario y el rol es_admin son obligatorios." },
        { status: 400 }
      );
    }

    // Prevent self-demotion
    const userToPatch = await queryOne<{ telefono: string }>(
      "SELECT telefono FROM usuarios WHERE id = $1",
      [id]
    );

    if (!userToPatch) {
      return NextResponse.json(
        { error: "El usuario no existe." },
        { status: 404 }
      );
    }

    if (userToPatch.telefono === callerPhone && es_admin === false) {
      return NextResponse.json(
        { error: "No puedes quitarte los permisos de administrador a ti mismo." },
        { status: 400 }
      );
    }

    await query("UPDATE usuarios SET es_admin = $1 WHERE id = $2", [es_admin, id]);

    return NextResponse.json({
      success: true,
      message: "Rol de usuario actualizado con éxito.",
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar usuario." },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/usuarios — Delete a user
export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await checkIsAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const callerPhone = req.headers.get("x-user-phone");
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "El parámetro 'id' es obligatorio." },
        { status: 400 }
      );
    }

    // Prevent self-deletion
    const userToDelete = await queryOne<{ telefono: string }>(
      "SELECT telefono FROM usuarios WHERE id = $1",
      [id]
    );

    if (!userToDelete) {
      return NextResponse.json(
        { error: "El usuario no existe." },
        { status: 404 }
      );
    }

    if (userToDelete.telefono === callerPhone) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propia cuenta mientras estás logueado." },
        { status: 400 }
      );
    }

    // Delete user (associated appointments will be set to NULL due to ON DELETE SET NULL constraint on schema)
    await query("DELETE FROM usuarios WHERE id = $1", [id]);

    return NextResponse.json({
      success: true,
      message: "Usuario eliminado con éxito.",
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return NextResponse.json(
      { error: "Error interno al eliminar usuario." },
      { status: 500 }
    );
  }
}
