import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "eb_session";

const PROTECTED = [
  "/dashboard",
  "/settings",
  "/journal",
  "/positions",
  "/analytics",
];
const ONBOARDING_ROUTE = "/onboarding";

function isProtected(pathname: string) {
  return PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get(SESSION_COOKIE);
  const hasSession = !!sessionCookie;

  // Simple check for onboarding status from cookie if possible, 
  // but usually we might need a more robust way.
  // For now, let's assume we might store a small flag in another cookie 
  // or just handle it carefully.
  // Actually, without parsing the session (which is usually a JWT or similar), 
  // middleware can't know `isOnboarded` easily unless it's in a separate cookie.
  
  // Let's check if we have an 'eb_onboarded' cookie.
  const isOnboarded = req.cookies.get("eb_onboarded")?.value === "true";

  if (isProtected(pathname) && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && !isOnboarded && pathname !== ONBOARDING_ROUTE && isProtected(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = ONBOARDING_ROUTE;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|api/).*)"],
};
