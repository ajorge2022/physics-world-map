import { NextResponse } from "next/server";
import { listLocalProfiles } from "@/lib/localDb";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabaseAdmin";
import { requireAdminPassword } from "@/lib/security";

export async function POST(request: Request) {
  const body = await request.json();
  if (!requireAdminPassword(body.admin_password)) {
    return NextResponse.json({ error: "Contrasena de administrador incorrecta." }, { status: 401 });
  }

  if (!hasSupabaseConfig()) {
    const profiles = (await listLocalProfiles())
      .filter((profile) => !profile.is_approved)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(({ edit_code_hash: _hash, ...profile }) => profile);

    return NextResponse.json({ profiles });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("physicists")
    .select("id,name,university_origin,current_city,country,current_institution,position,research_field,email,show_email,website,orcid,linkedin,year_left_university,latitude,longitude,is_approved,is_public,consent_given,created_at,updated_at")
    .eq("is_approved", false)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profiles: data ?? [] });
}
