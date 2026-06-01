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
  ["name", "Name", "text", true],
  ["university_origin", "University origin / department", "text", false],
  ["current_city", "Current city", "text", true],
  ["country", "Country", "text", true],
  ["current_institution", "Current institution", "text", false],
  ["position", "Position", "text", false],
  ["research_field", "Research field", "text", false],
  ["email", "Email", "email", false],
  ["website", "Website", "url", false],
  ["orcid", "ORCID", "text", false],
  ["linkedin", "LinkedIn", "url", false],
  ["year_left_university", "Year left university", "number", false]
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
      setMessage("Geocoding failed. Add city-level latitude and longitude and submit again.");
      return;
    }

    if (!response.ok) {
      setMessage(typeof result.error === "string" ? result.error : "Please check the form and try again.");
      return;
    }

    if (mode === "create") {
      setShownEditCode(result.editCode);
      setMessage("Profile submitted for admin approval.");
      event.currentTarget.reset();
    } else {
      setMessage("Profile updated. It will be reviewed again before appearing publicly.");
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
            <span className="field-label">Latitude</span>
            <input className="input" name="latitude" type="number" step="any" required defaultValue={initialProfile?.latitude ?? ""} />
          </label>
          <label className="block">
            <span className="field-label">Longitude</span>
            <input className="input" name="longitude" type="number" step="any" required defaultValue={initialProfile?.longitude ?? ""} />
          </label>
        </div>
      )}

      <div className="space-y-3">
        <label className="flex gap-3 text-sm text-stone-700">
          <input name="show_email" type="checkbox" defaultChecked={initialProfile?.show_email ?? false} className="mt-1" />
          Display my email publicly on the map popup.
        </label>
        {mode === "edit" && (
          <label className="flex gap-3 text-sm text-stone-700">
            <input name="is_public" type="checkbox" defaultChecked={initialProfile?.is_public ?? true} className="mt-1" />
            Keep my profile visible once approved.
          </label>
        )}
        <label className="flex gap-3 text-sm text-stone-700">
          <input name="consent_given" type="checkbox" required defaultChecked={initialProfile?.consent_given ?? false} className="mt-1" />I consent to storing and displaying city-level profile information according to the Privacy Policy.
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button className="button-primary" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : mode === "create" ? "Submit profile" : "Save changes"}
        </button>
        <button className="button-secondary" type="button" onClick={() => setManualCoordinates(true)}>
          Enter coordinates manually
        </button>
      </div>

      {message && <p className="text-sm font-medium text-stone-700">{message}</p>}
      {shownEditCode && (
        <div className="rounded-md border border-copper/30 bg-copper/10 p-4">
          <p className="text-sm font-semibold text-ink">Your edit code is shown once. Store it privately.</p>
          <code className="mt-2 block break-all rounded bg-white px-3 py-2 text-sm">{shownEditCode}</code>
        </div>
      )}
    </form>
  );
}
