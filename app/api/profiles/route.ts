import { NextResponse } from "next/server";
import { createLocalProfile, listLocalProfiles, updateLocalProfile } from "@/lib/localDb";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabaseAdmin";
import { geocodeCityCountry } from "@/lib/geocode";
import { getClientKey, rateLimit } from "@/lib/rateLimit";
import { generateEditCode, hashEditCode, requireAccessPassword, verifyEditCode } from "@/lib/security";
import { profileInputSchema, updateProfileSchema } from "@/lib/validation";

const publicColumns =
  "id,name,university_origin,current_city,country,current_institution,position,research_field,email,show_email,website,orcid,linkedin,year_left_university,latitude,longitude";

export async function GET() {
  if (!hasSupabaseConfig()) {
    const localProfiles = await listLocalProfiles();
    const profiles = localProfiles
      .filter((profile) => profile.is_approved && profile.is_public)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(({ edit_code_hash: _hash, ...profile }) => ({
        ...profile,
        email: profile.show_email ? profile.email : null
      }));

    return NextResponse.json({ profiles });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("physicists")
    .select(publicColumns)
    .eq("is_approved", true)
    .eq("is_public", true)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profiles = (data ?? []).map((profile) => ({
    ...profile,
    email: profile.show_email ? profile.email : null
  }));

  return NextResponse.json({ profiles });
}

export async function POST(request: Request) {
  if (!rateLimit(`create:${getClientKey(request)}`, 6, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many submissions. Try again later." }, { status: 429 });
  }

  const body = await request.json();
  if (!requireAccessPassword(body.access_password)) {
    return NextResponse.json({ error: "Invalid access password." }, { status: 401 });
  }

  const parsed = profileInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let latitude = parsed.data.latitude;
  let longitude = parsed.data.longitude;

  if (latitude === undefined || longitude === undefined) {
    const coordinates = await geocodeCityCountry(parsed.data.current_city, parsed.data.country);
    if (!coordinates) {
      return NextResponse.json(
        { error: "Geocoding failed. Please enter city-level latitude and longitude.", needsManualCoordinates: true },
        { status: 422 }
      );
    }
    latitude = coordinates.latitude;
    longitude = coordinates.longitude;
  }

  const finalLatitude = latitude;
  const finalLongitude = longitude;

  const editCode = generateEditCode();
  const editCodeHash = await hashEditCode(editCode);

  if (!hasSupabaseConfig()) {
    const profile = await createLocalProfile({
      ...parsed.data,
      university_origin: parsed.data.university_origin ?? null,
      current_institution: parsed.data.current_institution ?? null,
      position: parsed.data.position ?? null,
      research_field: parsed.data.research_field ?? null,
      email: parsed.data.email ?? null,
      website: parsed.data.website ?? null,
      orcid: parsed.data.orcid ?? null,
      linkedin: parsed.data.linkedin ?? null,
      year_left_university: parsed.data.year_left_university ?? null,
      latitude: finalLatitude,
      longitude: finalLongitude,
      edit_code_hash: editCodeHash,
      is_approved: false,
      is_public: true
    });

    return NextResponse.json({ id: profile.id, editCode }, { status: 201 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("physicists")
    .insert({
      ...parsed.data,
      latitude: finalLatitude,
      longitude: finalLongitude,
      edit_code_hash: editCodeHash,
      is_approved: false,
      is_public: true
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, editCode }, { status: 201 });
}

export async function PUT(request: Request) {
  if (!rateLimit(`edit:${getClientKey(request)}`, 20, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many edit attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!hasSupabaseConfig()) {
    const profiles = await listLocalProfiles();
    const existing = profiles.find((profile) => profile.id === parsed.data.id);

    if (!existing) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const isValid = await verifyEditCode(parsed.data.edit_code, existing.edit_code_hash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid edit code." }, { status: 401 });
    }

    const { id, edit_code: _editCode, ...update } = parsed.data;
    await updateLocalProfile(id, { ...update, is_approved: false });

    return NextResponse.json({ ok: true });
  }

  const supabase = getSupabaseAdmin();
  const { data: existing, error: fetchError } = await supabase
    .from("physicists")
    .select("id,edit_code_hash")
    .eq("id", parsed.data.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const isValid = await verifyEditCode(parsed.data.edit_code, existing.edit_code_hash);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid edit code." }, { status: 401 });
  }

  const { id, edit_code: _editCode, ...update } = parsed.data;
  const { error } = await supabase
    .from("physicists")
    .update({ ...update, is_approved: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : "";
  const editCode = typeof body.edit_code === "string" ? body.edit_code : "";

  if (!hasSupabaseConfig()) {
    const profiles = await listLocalProfiles();
    const existing = profiles.find((profile) => profile.id === id);

    if (!existing) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const isValid = await verifyEditCode(editCode, existing.edit_code_hash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid edit code." }, { status: 401 });
    }

    await updateLocalProfile(id, { is_public: false });

    return NextResponse.json({ ok: true });
  }

  const supabase = getSupabaseAdmin();
  const { data: existing, error: fetchError } = await supabase
    .from("physicists")
    .select("id,edit_code_hash")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const isValid = await verifyEditCode(editCode, existing.edit_code_hash);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid edit code." }, { status: 401 });
  }

  const { error } = await supabase
    .from("physicists")
    .update({ is_public: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
