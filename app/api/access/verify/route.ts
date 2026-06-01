import { NextResponse } from "next/server";
import { requireAccessPassword } from "@/lib/security";

export async function POST(request: Request) {
  const body = await request.json();
  if (!requireAccessPassword(body.access_password)) {
    return NextResponse.json({ error: "Contrasena incorrecta." }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
