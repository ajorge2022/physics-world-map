import { MapShell } from "@/components/MapShell";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <section className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-ink sm:text-4xl">UH Physics Map</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-700">
            Mapa a nivel de ciudad para perfiles aprobados de fisicos de nuestra red universitaria.
          </p>
        </div>
      </section>
      <MapShell />
    </main>
  );
}
