import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const publicRoutes = ["/auth/signin", "/api/auth"];

// Routes accessible to authenticated users without completed onboarding
const onboardingRoutes = ["/onboarding", "/api/profile"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Get session
  const session = await auth();

  // Redirect to sign-in if not authenticated
  if (!session) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Check if route is an onboarding route
  const isOnboardingRoute = onboardingRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  if (isOnboardingRoute) {
    return NextResponse.next();
  }

  // Check if onboarding is complete (via cookie)
  const onboarded = request.cookies.get("onboarded")?.value === "true";

  if (!onboarded) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
