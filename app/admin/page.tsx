"use client";

import { FormEvent, useState } from "react";
import type { Physicist } from "@/lib/types";

export default function AdminPage() {
  const [adminPassword, setAdminPassword] = useState("");
  const [profiles, setProfiles] = useState<Physicist[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadPending(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/admin/pending", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ admin_password: adminPassword })
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(result.error ?? "Could not load pending profiles.");
      return;
    }
    setProfiles(result.profiles ?? []);
  }

  async function act(id: string, action: "approve" | "reject" | "hide" | "delete") {
    setLoading(true);
    const response = await fetch("/api/admin/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ admin_password: adminPassword, id, action })
    });
    setLoading(false);
    if (!response.ok) {
      setMessage("Admin action failed.");
      return;
    }
    setProfiles((current) => current.filter((profile) => profile.id !== id));
  }

  async function exportCsv() {
    const response = await fetch("/api/profiles/export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ admin_password: adminPassword })
    });
    if (!response.ok) {
      setMessage("CSV export failed.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "physics-world-map-approved.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <h1 className="text-3xl font-semibold text-ink">Admin</h1>
      <form onSubmit={loadPending} className="mt-6 flex max-w-xl flex-col gap-3 rounded-md border border-stone-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end">
        <label className="block flex-1">
          <span className="field-label">Admin password</span>
          <input className="input" type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} required />
        </label>
        <button className="button-primary" type="submit" disabled={loading}>
          Load pending
        </button>
        <button className="button-secondary" type="button" onClick={exportCsv} disabled={!adminPassword}>
          Export CSV
        </button>
      </form>

      {message && <p className="mt-4 text-sm font-medium text-stone-700">{message}</p>}

      <section className="mt-6 grid gap-4">
        {profiles.map((profile) => (
          <article key={profile.id} className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <div>
                <h2 className="text-lg font-semibold text-ink">{profile.name}</h2>
                <p className="text-sm text-stone-700">
                  {profile.current_city}, {profile.country} · {profile.current_institution || "No institution"} · {profile.position || "No position"}
                </p>
                <p className="mt-2 text-sm text-stone-700">{profile.research_field || "No research field"}</p>
                {profile.email && <p className="mt-2 text-sm text-stone-600">{profile.email}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="button-primary" type="button" onClick={() => act(profile.id, "approve")}>Approve</button>
                <button className="button-secondary" type="button" onClick={() => act(profile.id, "reject")}>Reject</button>
                <button className="button-secondary" type="button" onClick={() => act(profile.id, "hide")}>Hide</button>
                <button className="button-danger" type="button" onClick={() => act(profile.id, "delete")}>Delete</button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
