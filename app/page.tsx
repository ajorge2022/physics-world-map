import { MapShell } from "@/components/MapShell";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <section className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-ink sm:text-4xl">Physics World Map</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-700">
            Public city-level locations for approved physicist profiles from our university network.
          </p>
        </div>
      </section>
      <MapShell />
    </main>
  );
}
