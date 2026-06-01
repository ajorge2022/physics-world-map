import { NextResponse } from "next/server";
import { deleteLocalProfile, updateLocalProfile } from "@/lib/localDb";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabaseAdmin";
import { requireAdminPassword } from "@/lib/security";
import { adminActionSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = adminActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!requireAdminPassword(parsed.data.admin_password)) {
    return NextResponse.json({ error: "Invalid admin password." }, { status: 401 });
  }

  const { id, action } = parsed.data;

  if (!hasSupabaseConfig()) {
    if (action === "delete") {
      await deleteLocalProfile(id);
      return NextResponse.json({ ok: true });
    }

    const changes =
      action === "approve"
        ? { is_approved: true, is_public: true }
        : action === "hide"
          ? { is_public: false }
          : { is_approved: false, is_public: false };

    await updateLocalProfile(id, changes);
    return NextResponse.json({ ok: true });
  }

  const supabase = getSupabaseAdmin();
  if (action === "delete") {
    const { error } = await supabase.from("physicists").delete().eq("id", id);
    return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true });
  }

  const changes =
    action === "approve"
      ? { is_approved: true, is_public: true }
      : action === "hide"
        ? { is_public: false }
        : { is_approved: false, is_public: false };

  const { error } = await supabase
    .from("physicists")
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
