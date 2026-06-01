"use client";

import { FormEvent, useState } from "react";
import MapClient from "@/components/MapClient";

export function MapGate() {
  const [accessPassword, setAccessPassword] = useState("");
  const [unlockedPassword, setUnlockedPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/access/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ access_password: accessPassword })
    });

    setLoading(false);

    if (!response.ok) {
      setMessage("Contrasena incorrecta.");
      return;
    }

    setUnlockedPassword(accessPassword);
  }

  if (unlockedPassword) {
    return <MapClient accessPassword={unlockedPassword} />;
  }

  return (
    <section className="grid min-h-[58vh] place-items-center rounded-md border border-stone-200 bg-white px-4 py-12 shadow-sm">
      <form onSubmit={unlock} className="w-full max-w-md">
        <h2 className="text-2xl font-semibold text-ink">Acceso al mapa</h2>
        <p className="mt-2 text-sm leading-6 text-stone-700">
          Introduce la contrasena compartida para ver los pines de UH Physics Map.
        </p>
        <label className="mt-5 block">
          <span className="field-label">Contrasena</span>
          <input
            className="input"
            type="password"
            value={accessPassword}
            onChange={(event) => setAccessPassword(event.target.value)}
            required
            autoFocus
          />
        </label>
        <button className="button-primary mt-4" type="submit" disabled={loading}>
          {loading ? "Comprobando..." : "Ver mapa"}
        </button>
        {message && <p className="mt-3 text-sm font-medium text-stone-700">{message}</p>}
      </form>
    </section>
  );
}
