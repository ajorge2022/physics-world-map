import { NextResponse } from "next/server";
import { listLocalProfiles } from "@/lib/localDb";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabaseAdmin";
import { requireAdminPassword } from "@/lib/security";

function escapeCsv(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!requireAdminPassword(body.admin_password)) {
    return NextResponse.json({ error: "Contrasena de administrador incorrecta." }, { status: 401 });
  }

  if (!hasSupabaseConfig()) {
    const rows = (await listLocalProfiles())
      .filter((profile) => profile.is_approved && profile.is_public)
      .map(({ edit_code_hash: _hash, ...profile }) => profile);
    const headers = rows[0] ? Object.keys(rows[0]) : ["id", "name", "current_city", "country", "latitude", "longitude"];
    const csv = [headers.join(","), ...rows.map((row) => headers.map((key) => escapeCsv(row[key as keyof typeof row])).join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="uh-physics-map-aprobados.csv"'
      }
    });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("physicists")
    .select("id,name,university_origin,current_city,country,current_institution,position,research_field,email,show_email,website,orcid,linkedin,year_left_university,latitude,longitude,created_at,updated_at")
    .eq("is_approved", true)
    .eq("is_public", true)
    .order("country", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const headers = rows[0] ? Object.keys(rows[0]) : ["id", "name", "current_city", "country", "latitude", "longitude"];
  const csv = [headers.join(","), ...rows.map((row) => headers.map((key) => escapeCsv(row[key as keyof typeof row])).join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="uh-physics-map-aprobados.csv"'
    }
  });
}
