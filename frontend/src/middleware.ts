import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  console.log("MW PATH:", pathname);
  console.log("MW COOKIES:", req.cookies.getAll());

  // Skip assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Allow login/signup
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Session cookie check
  const sessionCookie = req.cookies.get("better-auth.session_token");

  console.log("SESSION COOKIE:", sessionCookie);

  if (!sessionCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
