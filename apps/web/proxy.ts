import { NextRequest, NextResponse } from "next/server";

// Auth is cross-origin (API on fly.dev, frontend on vercel.app), so session
// cookies are scoped to fly.dev and never visible in Next.js middleware.
// Auth guards are handled client-side in AuthGuard (app layout).
export function proxy(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|api/).*)"],
};
