export type Coordinates = {
  latitude: number;
  longitude: number;
};

export async function geocodeCityCountry(city: string, country: string): Promise<Coordinates | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", `${city}, ${country}`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "0");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "UHPhysicsMap/0.1 admin-contact@example.edu"
    },
    next: { revalidate: 60 * 60 * 24 * 14 }
  });

  if (!response.ok) {
    return null;
  }

  const results = (await response.json()) as Array<{ lat?: string; lon?: string }>;
  const match = results[0];
  if (!match?.lat || !match.lon) {
    return null;
  }

  return {
    latitude: Number(match.lat),
    longitude: Number(match.lon)
  };
}
