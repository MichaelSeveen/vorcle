import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { segments } from "@/config/segments";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  const workspacePaths = Object.values(segments.workspace);
  const isProtectedRoute = workspacePaths.some((path) =>
    pathname.startsWith(path)
  );

  const isSignedIn = !!sessionCookie;
  const isAuthRoute = pathname.startsWith("/auth");

  if (isProtectedRoute && !isSignedIn) {
    const signInUrl = new URL(segments.signIn, request.url);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthRoute && isSignedIn) {
    const workspaceUrl = new URL(segments.workspace.home, request.url);
    return NextResponse.redirect(workspaceUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/chat/:path*",
    "/integrations/:path*",
    "/pricing/:path*",
    "/settings/:path*",
    "/auth/:path*",
  ],
};
