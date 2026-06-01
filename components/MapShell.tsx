"use client";

import dynamic from "next/dynamic";

const MapGate = dynamic(() => import("@/components/MapGate").then((module) => module.MapGate), {
  ssr: false,
  loading: () => <div className="h-[72vh] rounded-md border border-stone-200 bg-white" />
});

export function MapShell() {
  return <MapGate />;
}
