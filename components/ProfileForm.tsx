"use client";

import { FormEvent, useState } from "react";
import type { Physicist } from "@/lib/types";

type Props = {
  mode: "create" | "edit";
  initialProfile?: Physicist;
  editCode?: string;
  accessPassword?: string;
};

const fields = [
  ["name", "Nombre", "text", true],
  ["university_origin", "Origen universitario / departamento", "text", false],
  ["current_city", "Ciudad actual", "text", true],
  ["country", "Pais", "text", true],
  ["current_institution", "Institucion actual", "text", false],
  ["position", "Cargo", "text", false],
  ["research_field", "Campo de investigacion", "text", false],
  ["email", "Email", "email", false],
  ["website", "Sitio web", "url", false],
  ["orcid", "ORCID", "text", false],
  ["linkedin", "LinkedIn", "url", false],
  ["year_left_university", "Ano en que salio de la universidad", "number", false]
] as const;

export function ProfileForm({ mode, initialProfile, editCode, accessPassword }: Props) {
  const [manualCoordinates, setManualCoordinates] = useState(Boolean(initialProfile));
  const [message, setMessage] = useState("");
  const [shownEditCode, setShownEditCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch("/api/profiles", {
      method: mode === "create" ? "POST" : "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...payload,
        access_password: accessPassword,
        id: initialProfile?.id,
        edit_code: editCode,
        show_email: formData.get("show_email") === "on",
        consent_given: formData.get("consent_given") === "on",
        is_public: formData.get("is_public") !== "off"
      })
    });

    const result = await response.json().catch(() => ({}));
    setSubmitting(false);

    if (result.needsManualCoordinates) {
      setManualCoordinates(true);
      setMessage("No se pudo geocodificar. Agrega latitud y longitud a nivel de ciudad y envia de nuevo.");
      return;
    }

    if (!response.ok) {
      setMessage(typeof result.error === "string" ? result.error : "Revisa el formulario e intentalo de nuevo.");
      return;
    }

    if (mode === "create") {
      setShownEditCode(result.editCode);
      setMessage("Perfil enviado para aprobacion administrativa.");
      event.currentTarget.reset();
    } else {
      setMessage("Perfil actualizado. Sera revisado de nuevo antes de aparecer publicamente.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-md border border-stone-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(([name, label, type, required]) => (
          <label key={name} className="block">
            <span className="field-label">{label}</span>
            <input
              className="input"
              name={name}
              type={type}
              required={required}
              defaultValue={initialProfile?.[name as keyof Physicist]?.toString() ?? ""}
            />
          </label>
        ))}
      </div>

      {manualCoordinates && (
        <div className="grid gap-4 rounded-md bg-stone-50 p-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Latitud</span>
            <input className="input" name="latitude" type="number" step="any" required defaultValue={initialProfile?.latitude ?? ""} />
          </label>
          <label className="block">
            <span className="field-label">Longitud</span>
            <input className="input" name="longitude" type="number" step="any" required defaultValue={initialProfile?.longitude ?? ""} />
          </label>
        </div>
      )}

      <div className="space-y-3">
        <label className="flex gap-3 text-sm text-stone-700">
          <input name="show_email" type="checkbox" defaultChecked={initialProfile?.show_email ?? false} className="mt-1" />
          Mostrar mi email publicamente en el popup del mapa.
        </label>
        {mode === "edit" && (
          <label className="flex gap-3 text-sm text-stone-700">
            <input name="is_public" type="checkbox" defaultChecked={initialProfile?.is_public ?? true} className="mt-1" />
            Mantener mi perfil visible cuando sea aprobado.
          </label>
        )}
        <label className="flex gap-3 text-sm text-stone-700">
          <input name="consent_given" type="checkbox" required defaultChecked={initialProfile?.consent_given ?? false} className="mt-1" />
          Doy mi consentimiento para guardar y mostrar informacion de perfil a nivel de ciudad segun la Politica de Privacidad.
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button className="button-primary" type="submit" disabled={submitting}>
          {submitting ? "Guardando..." : mode === "create" ? "Enviar perfil" : "Guardar cambios"}
        </button>
        <button className="button-secondary" type="button" onClick={() => setManualCoordinates(true)}>
          Ingresar coordenadas manualmente
        </button>
      </div>

      {message && <p className="text-sm font-medium text-stone-700">{message}</p>}
      {shownEditCode && (
        <div className="rounded-md border border-copper/30 bg-copper/10 p-4">
          <p className="text-sm font-semibold text-ink">Tu codigo de edicion se muestra una sola vez. Guardalo en privado.</p>
          <code className="mt-2 block break-all rounded bg-white px-3 py-2 text-sm">{shownEditCode}</code>
        </div>
      )}
    </form>
  );
}
