import { NextResponse } from "next/server";
import { searchCitySuggestions } from "@/lib/geocode";
import { getClientKey, rateLimit } from "@/lib/rateLimit";

export async function GET(request: Request) {
  if (!rateLimit(`geocode:${getClientKey(request)}`, 60, 10 * 60_000)) {
    return NextResponse.json({ error: "Demasiadas busquedas. Intentalo de nuevo mas tarde." }, { status: 429 });
  }

  const url = new URL(request.url);
  const city = url.searchParams.get("city") ?? "";
  const country = url.searchParams.get("country") ?? "";
  const countryCode = url.searchParams.get("country_code") ?? undefined;

  if (city.trim().length < 2 || !country.trim()) {
    return NextResponse.json({ suggestions: [] });
  }

  const suggestions = await searchCitySuggestions(city, country, countryCode);
  return NextResponse.json({ suggestions });
}
