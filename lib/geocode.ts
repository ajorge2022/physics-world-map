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

type OpenMeteoResult = {
  name?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  admin2?: string;
};

type RestCountryResult = {
  latlng?: [number, number];
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

async function fetchNominatim(url: URL) {
  const response = await fetch(url, {
    headers: nominatimHeaders,
    next: { revalidate: 60 * 60 * 24 * 14 }
  }).catch(() => null);

  if (!response?.ok) {
    return [];
  }

  return (await response.json()) as NominatimResult[];
}

function nominatimToSuggestions(results: NominatimResult[], country: string, fallbackCity: string): CitySuggestion[] {
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
        city: cityName || fallbackCity,
        country: countryName,
        label: labelParts.join(", ") || result.display_name || `${fallbackCity}, ${country}`,
        latitude: Number(result.lat),
        longitude: Number(result.lon)
      }
    ];
  });
}

async function searchOpenMeteoCities(city: string, country: string, countryCode?: string, count = 6): Promise<CitySuggestion[]> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", city);
  url.searchParams.set("count", String(count));
  url.searchParams.set("language", "es");
  url.searchParams.set("format", "json");

  const response = await fetch(url, {
    next: { revalidate: 60 * 60 * 24 * 14 }
  }).catch(() => null);

  if (!response?.ok) {
    return [];
  }

  const payload = (await response.json()) as { results?: OpenMeteoResult[] };
  const normalizedCountryCode = countryCode?.toUpperCase();

  return (payload.results ?? [])
    .filter((result) => !normalizedCountryCode || result.country_code?.toUpperCase() === normalizedCountryCode)
    .flatMap((result) => {
      if (typeof result.latitude !== "number" || typeof result.longitude !== "number") {
        return [];
      }

      const cityName = result.name ?? city;
      const countryName = result.country ?? country;
      const labelParts = [cityName, result.admin1, result.admin2, countryName].filter(Boolean);

      return [
        {
          city: cityName,
          country: countryName,
          label: labelParts.join(", "),
          latitude: result.latitude,
          longitude: result.longitude
        }
      ];
    });
}

async function geocodeCountry(countryCode?: string): Promise<Coordinates | null> {
  if (!countryCode) {
    return null;
  }

  const response = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}?fields=latlng`, {
    next: { revalidate: 60 * 60 * 24 * 30 }
  }).catch(() => null);

  if (!response?.ok) {
    return null;
  }

  const payload = (await response.json()) as RestCountryResult;
  if (!payload.latlng || payload.latlng.length < 2) {
    return null;
  }

  return {
    latitude: payload.latlng[0],
    longitude: payload.latlng[1]
  };
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

  const results = await fetchNominatim(url);
  const match = results[0];
  if (match?.lat && match.lon) {
    return {
      latitude: Number(match.lat),
      longitude: Number(match.lon)
    };
  }

  if (trimmedCity) {
    const fallbackCity = await searchOpenMeteoCities(trimmedCity, country, countryCode, 1);
    const fallbackMatch = fallbackCity[0];
    if (fallbackMatch) {
      return {
        latitude: fallbackMatch.latitude,
        longitude: fallbackMatch.longitude
      };
    }
  }

  return geocodeCountry(countryCode);
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

  const nominatimSuggestions = nominatimToSuggestions(await fetchNominatim(url), country, trimmedCity);
  if (nominatimSuggestions.length > 0) {
    return nominatimSuggestions;
  }

  return searchOpenMeteoCities(trimmedCity, country, countryCode);
}
