import { NextRequest } from "next/server";
import { queryOne } from "@/lib/db";

/**
 * Validates if the requesting user (identified by header x-user-phone) is an admin.
 */
export async function checkIsAdmin(req: NextRequest): Promise<boolean> {
  const phone = req.headers.get("x-user-phone");
  if (!phone || phone.length !== 10) return false;
  
  const user = await queryOne<{ es_admin: boolean }>(
    "SELECT es_admin FROM usuarios WHERE telefono = $1",
    [phone]
  );
  
  return user?.es_admin ?? false;
}
