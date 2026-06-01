"use client";

import { FormEvent, useState } from "react";
import { ProfileForm } from "@/components/ProfileForm";

export default function AddPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [accessPassword, setAccessPassword] = useState("");
  const [message, setMessage] = useState("");

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/access/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ access_password: accessPassword })
    });
    if (!response.ok) {
      setMessage("Contrasena compartida incorrecta.");
      return;
    }
    setUnlocked(true);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      <h1 className="text-3xl font-semibold text-ink">Agregar mi ubicacion</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-700">
        Envia solo informacion a nivel de ciudad. Los perfiles nuevos quedan ocultos hasta que un administrador los apruebe.
      </p>

      {!unlocked ? (
        <form onSubmit={unlock} className="mt-6 max-w-md rounded-md border border-stone-200 bg-white p-5 shadow-sm">
          <label className="block">
            <span className="field-label">Contrasena compartida</span>
            <input className="input" type="password" value={accessPassword} onChange={(event) => setAccessPassword(event.target.value)} required />
          </label>
          <button className="button-primary mt-4" type="submit">
            Abrir formulario
          </button>
          {message && <p className="mt-3 text-sm font-medium text-stone-700">{message}</p>}
        </form>
      ) : (
        <div className="mt-6">
          <ProfileForm mode="create" accessPassword={accessPassword} />
        </div>
      )}
    </main>
  );
}
