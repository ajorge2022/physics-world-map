import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SITE_DISABLED = true;

export function middleware(request: NextRequest) {
  if (!SITE_DISABLED) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (
    pathname === "/offline" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml")
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Sitio temporalmente desactivado." }, { status: 503 });
  }

  const offlineUrl = request.nextUrl.clone();
  offlineUrl.pathname = "/offline";
  offlineUrl.search = "";
  return NextResponse.redirect(offlineUrl);
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"]
};
