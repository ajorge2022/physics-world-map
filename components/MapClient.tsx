"use client";

import { useEffect, useMemo, useState } from "react";
import { divIcon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { PublicPhysicist } from "@/lib/types";

const markerIcon = divIcon({
  className: "",
  html: '<span class="physics-pin"></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -22]
});

function unique(values: Array<string | null>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b));
}

export default function MapClient({ accessPassword }: { accessPassword: string }) {
  const [profiles, setProfiles] = useState<PublicPhysicist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    country: "",
    research_field: "",
    position: "",
    current_institution: ""
  });

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch("/api/profiles", {
      headers: {
        "x-physics-map-access-password": accessPassword
      }
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "No se pudo cargar el mapa.");
        }
        setProfiles(payload.profiles ?? []);
      })
      .catch((fetchError: Error) => setError(fetchError.message))
      .finally(() => setLoading(false));
  }, [accessPassword]);

  const options = useMemo(
    () => ({
      countries: unique(profiles.map((profile) => profile.country)),
      fields: unique(profiles.map((profile) => profile.research_field)),
      positions: unique(profiles.map((profile) => profile.position)),
      institutions: unique(profiles.map((profile) => profile.current_institution))
    }),
    [profiles]
  );

  const visibleProfiles = profiles.filter((profile) => {
    return (
      (!filters.country || profile.country === filters.country) &&
      (!filters.research_field || profile.research_field === filters.research_field) &&
      (!filters.position || profile.position === filters.position) &&
      (!filters.current_institution || profile.current_institution === filters.current_institution)
    );
  });

  return (
    <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">Filtros</h2>
          <button
            className="text-sm font-medium text-marine hover:underline"
            onClick={() => setFilters({ country: "", research_field: "", position: "", current_institution: "" })}
            type="button"
          >
            Reiniciar
          </button>
        </div>
        <div className="mt-4 space-y-4">
          <FilterSelect label="Pais" value={filters.country} values={options.countries} onChange={(country) => setFilters((current) => ({ ...current, country }))} />
          <FilterSelect label="Campo de investigacion" value={filters.research_field} values={options.fields} onChange={(research_field) => setFilters((current) => ({ ...current, research_field }))} />
          <FilterSelect label="Cargo" value={filters.position} values={options.positions} onChange={(position) => setFilters((current) => ({ ...current, position }))} />
          <FilterSelect label="Institucion" value={filters.current_institution} values={options.institutions} onChange={(current_institution) => setFilters((current) => ({ ...current, current_institution }))} />
        </div>
        <p className="mt-5 text-sm text-stone-600">
          Mostrando {visibleProfiles.length} de {profiles.length} perfiles publicos aprobados.
        </p>
      </aside>

      <div className="h-[72vh] min-h-[520px] overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-stone-600">Cargando datos del mapa...</div>
        ) : error ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-stone-700">{error}</div>
        ) : (
          <MapContainer center={[30, 0]} zoom={2} minZoom={2} scrollWheelZoom className="z-0">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {visibleProfiles.map((profile) => (
              <Marker key={profile.id} icon={markerIcon} position={[profile.latitude, profile.longitude]}>
                <Popup>
                  <div className="space-y-1 text-sm">
                    <h3 className="text-base font-semibold text-ink">{profile.name}</h3>
                    <p>
                      {profile.current_city}, {profile.country}
                    </p>
                    {profile.current_institution && <p>{profile.current_institution}</p>}
                    {profile.position && <p>{profile.position}</p>}
                    {profile.research_field && <p>{profile.research_field}</p>}
                    <div className="pt-2 text-marine">
                      {profile.website && (
                        <a className="block hover:underline" href={profile.website} target="_blank" rel="noreferrer">
                          Sitio web
                        </a>
                      )}
                      {profile.orcid && (
                        <a className="block hover:underline" href={`https://orcid.org/${profile.orcid}`} target="_blank" rel="noreferrer">
                          ORCID {profile.orcid}
                        </a>
                      )}
                      {profile.linkedin && (
                        <a className="block hover:underline" href={profile.linkedin} target="_blank" rel="noreferrer">
                          LinkedIn
                        </a>
                      )}
                      {profile.email && <a className="block hover:underline" href={`mailto:${profile.email}`}>{profile.email}</a>}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  values,
  onChange
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <select className="input" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Todos</option>
        {values.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}
