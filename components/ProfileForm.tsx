"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { COUNTRY_CODES } from "@/lib/countries";
import type { Physicist } from "@/lib/types";

type Props = {
  mode: "create" | "edit";
  initialProfile?: Physicist;
  editCode?: string;
  accessPassword?: string;
};

type CitySuggestion = {
  city: string;
  country: string;
  label: string;
  latitude: number;
  longitude: number;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

const textFields = [
  ["name", "Nombre", true],
  ["university_origin", "Universidad de origen", false],
  ["current_institution", "Institucion actual", false],
  ["position", "Cargo", false],
  ["research_field", "Campo de investigacion", false]
] as const;

function regionName(code: string, locale: "es" | "en") {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

const countryOptions = COUNTRY_CODES.map((code) => ({
  code,
  label: regionName(code, "es"),
  englishLabel: regionName(code, "en")
})).sort((a, b) => a.label.localeCompare(b.label, "es"));

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("es");
}

function findCountryOption(country?: string | null) {
  if (!country) {
    return undefined;
  }

  const normalizedCountry = normalize(country);
  return countryOptions.find(
    (option) => normalize(option.label) === normalizedCountry || normalize(option.englishLabel) === normalizedCountry
  );
}

function getProfileValue(profile: Physicist | undefined, name: (typeof textFields)[number][0]) {
  return profile?.[name]?.toString() ?? "";
}

export function ProfileForm({ mode, initialProfile, editCode, accessPassword }: Props) {
  const initialCountryOption = useMemo(() => findCountryOption(initialProfile?.country), [initialProfile?.country]);
  const [manualCoordinates, setManualCoordinates] = useState(Boolean(initialProfile));
  const [message, setMessage] = useState("");
  const [shownEditCode, setShownEditCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [countryCode, setCountryCode] = useState(initialCountryOption?.code ?? "");
  const [countryName, setCountryName] = useState(initialCountryOption?.label ?? initialProfile?.country ?? "");
  const [city, setCity] = useState(initialProfile?.current_city ?? "");
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [citySearchMessage, setCitySearchMessage] = useState("");
  const [selectedCoordinates, setSelectedCoordinates] = useState<Coordinates | null>(null);
  const [selectedCity, setSelectedCity] = useState("");

  useEffect(() => {
    const trimmedCity = city.trim();
    if (!countryName || trimmedCity.length < 2 || (selectedCoordinates && selectedCity === trimmedCity)) {
      setCitySuggestions([]);
      setCitySearchMessage("");
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setCitySearchMessage("Buscando ciudades...");
      const params = new URLSearchParams({
        city: trimmedCity,
        country: countryName
      });
      if (countryCode) {
        params.set("country_code", countryCode);
      }

      try {
        const response = await fetch(`/api/geocode/search?${params.toString()}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error ?? "No se pudo buscar la ciudad.");
        }

        const suggestions = (result.suggestions ?? []) as CitySuggestion[];
        setCitySuggestions(suggestions);
        setCitySearchMessage(suggestions.length ? "Selecciona una ciudad para fijar mejor el pin." : "No se encontraron ciudades.");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setCitySuggestions([]);
          setCitySearchMessage("No se pudo buscar la ciudad ahora.");
        }
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [city, countryCode, countryName, selectedCity, selectedCoordinates]);

  function updateCountry(nextCode: string) {
    const option = countryOptions.find((item) => item.code === nextCode);
    setCountryCode(nextCode);
    setCountryName(option?.label ?? "");
    setSelectedCoordinates(null);
    setSelectedCity("");
    setCitySuggestions([]);
    setCitySearchMessage("");
  }

  function updateCity(nextCity: string) {
    setCity(nextCity);
    setSelectedCoordinates(null);
    setSelectedCity("");
  }

  function chooseCity(suggestion: CitySuggestion) {
    setCity(suggestion.city);
    setSelectedCity(suggestion.city);
    setSelectedCoordinates({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude
    });
    setCitySuggestions([]);
    setCitySearchMessage("Ciudad seleccionada para el pin.");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch("/api/profiles", {
      method: mode === "create" ? "POST" : "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...payload,
        access_password: accessPassword,
        id: initialProfile?.id,
        edit_code: editCode,
        show_email: false,
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
      setMessage("Perfil agregado y visible en el mapa.");
      form.reset();
      setCountryCode("");
      setCountryName("");
      setCity("");
      setSelectedCoordinates(null);
      setSelectedCity("");
      setCitySuggestions([]);
      setCitySearchMessage("");
    } else {
      setMessage("Perfil actualizado. Sera revisado de nuevo antes de aparecer publicamente.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-md border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-stone-700">Solo Nombre y Pais son obligatorios.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Nombre *</span>
          <input
            className="input"
            name="name"
            type="text"
            required
            defaultValue={getProfileValue(initialProfile, "name")}
          />
        </label>

        <label className="block">
          <span className="field-label">Ciudad actual</span>
          <input
            className="input"
            name="current_city"
            type="text"
            value={city}
            onChange={(event) => updateCity(event.target.value)}
            autoComplete="off"
          />
          {countryName && city.trim().length >= 2 && (
            <div className="relative">
              {citySuggestions.length > 0 && (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-md border border-stone-200 bg-white shadow-lg">
                  {citySuggestions.map((suggestion) => (
                    <button
                      className="block w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-100"
                      key={`${suggestion.label}-${suggestion.latitude}-${suggestion.longitude}`}
                      onClick={() => chooseCity(suggestion)}
                      type="button"
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {citySearchMessage && <span className="mt-2 block text-xs text-stone-500">{citySearchMessage}</span>}
        </label>

        <label className="block">
          <span className="field-label">Universidad de origen</span>
          <input
            className="input"
            name="university_origin"
            type="text"
            defaultValue={getProfileValue(initialProfile, "university_origin")}
          />
        </label>

        <label className="block">
          <span className="field-label">Pais *</span>
          <select className="input" value={countryCode} onChange={(event) => updateCountry(event.target.value)} required>
            <option value="">Selecciona un pais</option>
            {countryOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
          <input name="country" type="hidden" value={countryName} />
          <input name="country_code" type="hidden" value={countryCode} />
        </label>

        {textFields.slice(2).map(([name, label, required]) => (
          <label key={name} className="block">
            <span className="field-label">{label}</span>
            <input
              className="input"
              name={name}
              type="text"
              required={required}
              defaultValue={getProfileValue(initialProfile, name)}
            />
          </label>
        ))}
      </div>

      {selectedCoordinates && !manualCoordinates && (
        <>
          <input name="latitude" type="hidden" value={selectedCoordinates.latitude} />
          <input name="longitude" type="hidden" value={selectedCoordinates.longitude} />
        </>
      )}

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
