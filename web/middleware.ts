import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function normalizeReturnTo(value: string | null) {
  const normalized = (value || "").trim();
  if (!normalized || !normalized.startsWith("/") || normalized.startsWith("//")) {
    return "/";
  }
  return normalized;
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname !== "/login" && pathname !== "/register") {
    return NextResponse.next();
  }

  if (searchParams.get("mode") === "callback") {
    return NextResponse.next();
  }

  const returnTo = normalizeReturnTo(searchParams.get("return_to"));
  const loginUrl = new URL("/api/public/auth/ixiamen/start", request.url);
  loginUrl.searchParams.set("return_to", returnTo);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/login", "/register"],
};
