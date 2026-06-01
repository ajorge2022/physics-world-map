"use client";

import { FormEvent, useState } from "react";
import { ProfileForm } from "@/components/ProfileForm";
import type { Physicist } from "@/lib/types";

export default function EditPage() {
  const [profile, setProfile] = useState<Physicist | null>(null);
  const [editCode, setEditCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const code = String(formData.get("edit_code") ?? "");
    const response = await fetch("/api/profiles/verify-edit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        identifier: formData.get("identifier"),
        edit_code: code
      })
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(result.error ?? "Could not verify this profile.");
      return;
    }
    setEditCode(code);
    setProfile(result.profile);
  }

  async function hideProfile() {
    if (!profile) return;
    setLoading(true);
    const response = await fetch("/api/profiles", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: profile.id, edit_code: editCode })
    });
    setLoading(false);
    setMessage(response.ok ? "Profile hidden from the public map." : "Could not hide the profile.");
    if (response.ok) {
      setProfile({ ...profile, is_public: false });
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      <h1 className="text-3xl font-semibold text-ink">Edit my pin</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-700">
        Enter your public name or email and your private edit code to update or hide your profile.
      </p>

      {!profile ? (
        <form onSubmit={verify} className="mt-6 max-w-lg rounded-md border border-stone-200 bg-white p-5 shadow-sm">
          <label className="block">
            <span className="field-label">Email or name</span>
            <input className="input" name="identifier" required />
          </label>
          <label className="mt-4 block">
            <span className="field-label">Edit code</span>
            <input className="input" name="edit_code" type="password" required />
          </label>
          <button className="button-primary mt-4" type="submit" disabled={loading}>
            {loading ? "Checking..." : "Continue"}
          </button>
        </form>
      ) : (
        <div className="mt-6 space-y-4">
          <ProfileForm mode="edit" initialProfile={profile} editCode={editCode} />
          <div className="rounded-md border border-red-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-ink">Hide my profile</h2>
            <p className="mt-1 text-sm text-stone-700">This keeps the record for admin review but removes it from the public map.</p>
            <button className="button-danger mt-4" onClick={hideProfile} disabled={loading} type="button">
              Hide profile
            </button>
          </div>
        </div>
      )}
      {message && <p className="mt-4 text-sm font-medium text-stone-700">{message}</p>}
    </main>
  );
}
