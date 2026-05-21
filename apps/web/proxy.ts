import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "eb_session";

const PROTECTED = [
  '/dashboard',
  '/trades',
  '/analytics',
  '/calendar',
  '/mind-lab',
  '/playbooks',
  '/journal',
  '/ai-review',
  '/goals',
  '/settings',
  '/onboarding',
];
const ONBOARDING_ROUTE = "/onboarding";

function isProtected(pathname: string) {
  return PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get(SESSION_COOKIE);
  const hasSession = !!sessionCookie;

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
