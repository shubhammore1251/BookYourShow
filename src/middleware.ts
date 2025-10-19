// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// export function middleware(req: NextRequest) {
//   const res = NextResponse.next();

//   res.headers.set("Access-Control-Allow-Origin", "*");
//   res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
//   res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

//   // Handle preflight requests
//   if (req.method === "OPTIONS") {
//     return new Response(null, {
//       headers: {
//         "Access-Control-Allow-Origin": "*",
//         "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
//         "Access-Control-Allow-Headers": "Content-Type, Authorization",
//       },
//     });
//   }

//   return res;
// }

// // only apply to API routes inside src/api/*
// export const config = {
//   matcher: "/api/:path*",
// };

// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");
  const res = NextResponse.next();

  res.headers.set("Access-Control-Allow-Origin", origin || "*");
  res.headers.set("Vary", "Origin");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Vary": "Origin",
      },
    });
  }

  return res;
}

export const config = {
  matcher: "/api/:path*",
};
