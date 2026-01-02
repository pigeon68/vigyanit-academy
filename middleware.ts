import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createAdminClient } from "@/lib/supabase/admin";

const portalRoleMap: Record<string, string> = {
  "/portal/admin": "admin",
  "/portal/teacher": "teacher",
  "/portal/parent": "parent",
  "/portal/student": "student",
};

function applyCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach(({ name, value, options }) =>
    target.cookies.set(name, value, options)
  );
  return target;
}

function getRequiredRole(pathname: string): string | null {
  for (const [prefix, role] of Object.entries(portalRoleMap)) {
    if (pathname.startsWith(prefix)) return role;
  }
  return null;
}

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith("/portal") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/parent") ||
    pathname.startsWith("/teacher")
  );
}

export async function middleware(request: NextRequest) {
  const { supabase, user, response: supabaseResponse } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  const requiredRole = getRequiredRole(pathname);

  if (isProtectedPath(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return applyCookies(NextResponse.redirect(url), supabaseResponse);
  }

  // TODO: Re-enable role-based access control after RLS policies are fixed
  // Currently RLS is disabled to avoid infinite recursion errors

  // Basic security headers applied to all routes
  supabaseResponse.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.stripe.com https://slelguoygbfzlpylpxfs.supabase.co",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https://images.unsplash.com https://*.supabase.co",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://js.stripe.com https://api.stripe.com https://slelguoygbfzlpylpxfs.supabase.co",
      "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ")
  );
  supabaseResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff");
  supabaseResponse.headers.set("X-Frame-Options", "DENY");
  supabaseResponse.headers.set("X-XSS-Protection", "0");
  supabaseResponse.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
