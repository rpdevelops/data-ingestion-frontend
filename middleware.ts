import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!api/|_next/|.*\\.|auth/login|auth/register).*)',
    '/client-area/:path*',
    '/manager/:path*',
    '/comercial/:path*',
    '/desenvolvimento/:path*'
  ],
};
