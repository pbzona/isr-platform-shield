import { NextRequest, NextResponse } from "next/server";

// Look up hostname here to map to the correct project
// It's almost a noop in this example, but if you had multiple core projects this
// is how you would handle routing based on the hostname
const getCoreUrl = (hostname: string) => {
  console.log(`Checking host for: ${hostname}`);

  return process.env.NODE_ENV === "production"
    ? `https://core.vercel-labs.vercel.app`
    : `http://core.localhost:3000`;
};

// Helper
const extractSubdomain = (hostname: string) => {
  return hostname.match(/^(?<subdomain>.*)\.[^.]+\.[^.]+$/)?.groups?.subdomain;
};

// Main proxy function
export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  const coreUrl = getCoreUrl(hostname);
  const subdomain = extractSubdomain(hostname);
  if (!subdomain) return new Response("Subdomain not found", { status: 404 });

  // Handle root path for all tenants
  if (pathname === "/") {
    const url = new URL(`/s/${subdomain}`, coreUrl);
    return NextResponse.rewrite(url);
  }

  // Handle all other tenant paths
  // Static assets and API routes are excluded because their route
  // structure is not relative to the subdomain - it will be handled separately
  if (pathname.match(/\/((?!_next|api).*)/)) {
    const url = new URL(`/s/${subdomain}${pathname}`, coreUrl);
    return NextResponse.rewrite(url);
  }

  // Fallback to passing the pathname as-is
  const url = new URL(pathname, coreUrl);
  return NextResponse.rewrite(url);
}
