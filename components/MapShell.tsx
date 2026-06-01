"use client";

import dynamic from "next/dynamic";

const MapClient = dynamic(() => import("@/components/MapClient"), {
  ssr: false,
  loading: () => <div className="h-[72vh] rounded-md border border-stone-200 bg-white" />
});

export function MapShell() {
  return <MapClient />;
}
