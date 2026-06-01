import { NextResponse } from "next/server";
import { listLocalProfiles } from "@/lib/localDb";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabaseAdmin";
import { getClientKey, rateLimit } from "@/lib/rateLimit";
import { verifyEditCode } from "@/lib/security";
import { editLookupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!rateLimit(`verify:${getClientKey(request)}`, 12, 10 * 60_000)) {
    return NextResponse.json({ error: "Demasiados intentos. Intentalo de nuevo mas tarde." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = editLookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { identifier, edit_code: editCode } = parsed.data;
  const safeIdentifier = identifier.replaceAll("%", "\\%").replaceAll(",", " ");

  if (!hasSupabaseConfig()) {
    const localProfiles = await listLocalProfiles();
    const loweredIdentifier = identifier.toLowerCase();

    for (const profile of localProfiles) {
      const matchesIdentifier =
        profile.name.toLowerCase().includes(loweredIdentifier) ||
        Boolean(profile.email?.toLowerCase().includes(loweredIdentifier));

      if (!matchesIdentifier) {
        continue;
      }

      const valid = await verifyEditCode(editCode, profile.edit_code_hash);
      if (valid) {
        const { edit_code_hash: _hash, ...safeProfile } = profile;
        return NextResponse.json({ profile: safeProfile });
      }
    }

    return NextResponse.json({ error: "No se encontro un perfil con ese codigo de edicion." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("physicists")
    .select("*")
    .or(`name.ilike.%${safeIdentifier}%,email.ilike.%${safeIdentifier}%`)
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const profile of data ?? []) {
    const valid = await verifyEditCode(editCode, profile.edit_code_hash);
    if (valid) {
      const { edit_code_hash: _hash, ...safeProfile } = profile;
      return NextResponse.json({ profile: safeProfile });
    }
  }

  return NextResponse.json({ error: "No se encontro un perfil con ese codigo de edicion." }, { status: 401 });
}
