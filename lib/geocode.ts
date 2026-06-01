export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type CitySuggestion = Coordinates & {
  city: string;
  country: string;
  label: string;
};

type NominatimResult = {
  lat?: string;
  lon?: string;
  display_name?: string;
  name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
  };
};

const nominatimHeaders = {
  "Accept-Language": "es",
  "User-Agent": "UHPhysicsMap/0.1 admin-contact@example.edu"
};

function getCityName(result: NominatimResult) {
  return (
    result.address?.city ??
    result.address?.town ??
    result.address?.village ??
    result.address?.municipality ??
    result.name ??
    result.display_name?.split(",")[0]?.trim() ??
    ""
  );
}

function getCountryName(result: NominatimResult, fallbackCountry: string) {
  return result.address?.country ?? fallbackCountry;
}

export async function geocodeCityCountry(city: string | undefined, country: string, countryCode?: string): Promise<Coordinates | null> {
  const trimmedCity = city?.trim();
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", trimmedCity ? `${trimmedCity}, ${country}` : country);
  if (countryCode) {
    url.searchParams.set("countrycodes", countryCode.toLowerCase());
  }
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "0");

  const response = await fetch(url, {
    headers: nominatimHeaders,
    next: { revalidate: 60 * 60 * 24 * 14 }
  }).catch(() => null);

  if (!response?.ok) {
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

export async function searchCitySuggestions(city: string, country: string, countryCode?: string): Promise<CitySuggestion[]> {
  const trimmedCity = city.trim();
  if (trimmedCity.length < 2) {
    return [];
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", countryCode ? trimmedCity : `${trimmedCity}, ${country}`);
  if (countryCode) {
    url.searchParams.set("countrycodes", countryCode.toLowerCase());
  }
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "6");
  url.searchParams.set("dedupe", "1");
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url, {
    headers: nominatimHeaders,
    next: { revalidate: 60 * 60 * 24 * 14 }
  }).catch(() => null);

  if (!response?.ok) {
    return [];
  }

  const results = (await response.json()) as NominatimResult[];
  return results.flatMap((result) => {
    if (!result.lat || !result.lon) {
      return [];
    }

    const cityName = getCityName(result);
    const countryName = getCountryName(result, country);
    const region = result.address?.state ?? result.address?.county;
    const labelParts = [cityName, region, countryName].filter(Boolean);

    return [
      {
        city: cityName || trimmedCity,
        country: countryName,
        label: labelParts.join(", ") || result.display_name || `${trimmedCity}, ${country}`,
        latitude: Number(result.lat),
        longitude: Number(result.lon)
      }
    ];
  });
}
