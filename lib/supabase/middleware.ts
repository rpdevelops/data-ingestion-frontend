import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";
import { verifyToken } from "../auth/cognito";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  if (!hasEnvVars()) {
    // In development, allow access without auth if env vars are not set
    return response;
  }

  // Check for access token in cookies
  const accessToken = request.cookies.get("cognito_access_token")?.value;
  
  // Public paths that don't require authentication
  const publicPaths = ["/auth/login", "/auth/register", "/auth/error"];
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  // Allow public paths and static assets
  if (
    isPublicPath ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/favicon.ico") ||
    request.nextUrl.pathname === "/"
  ) {
    return response;
  }

  // If no token, redirect to login
  if (!accessToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Verify token validity
  try {
    const payload = await verifyToken(accessToken);
    if (!payload) {
      // Token is invalid, clear cookies and redirect
      response.cookies.delete("cognito_access_token");
      response.cookies.delete("cognito_id_token");
      response.cookies.delete("cognito_refresh_token");
      
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  } catch (error) {
    // Token verification failed, redirect to login
    response.cookies.delete("cognito_access_token");
    response.cookies.delete("cognito_id_token");
    response.cookies.delete("cognito_refresh_token");
    
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
