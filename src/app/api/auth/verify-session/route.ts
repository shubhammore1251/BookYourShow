import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { serialize } from "cookie";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("session");
    const nextAuthCookie =
      cookieStore.get("next-auth.session-token") ||
      cookieStore.get("__Secure-next-auth.session-token");

    let token = tokenCookie?.value || nextAuthCookie?.value;
    let cookieName = tokenCookie?.name || nextAuthCookie?.name;

    // console.log("token cookie", token);
    // console.log("nextAuthCookie", nextAuthCookie);

    if (!token) {
      console.log("token not found");
      return NextResponse.json(
        { user: null, message: "No Authorization token found" },
        {
          status: 401,
        }
      );
    }

    // verify JWT
    let decoded: { id: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    } catch (err) {
      console.log("token invalid", err);
      // token invalid or expired → remove from DB & clear cookie
      await prisma.session.deleteMany({ where: { sessionToken: token } });

      const clearCookie = serialize(`${cookieName}`, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });

      return NextResponse.json(
        { user: null, message: "Token expired or invalid" },
        {
          status: 401,
          headers: { "Set-Cookie": clearCookie },
        }
      );
    }

    console.log("decoded >>> ", decoded);

    // check session exists in DB
    const session = await prisma.session.findFirst({
      where: { sessionToken: token, userId: decoded.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            emailVerified: true,
          },
        },
      },
    });

    if (!session) {
      const clearCookie = serialize(`${cookieName}`, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return NextResponse.json(
        { user: null, message: "Session not found" },
        {
          status: 401,
          headers: { "Set-Cookie": clearCookie },
        }
      );
    }

    console.log("session found", session);
    return NextResponse.json(
      { user: session.user, message: "Session found" },
      {
        status: 200,
      }
    );
  } catch (err) {
    console.log("error", err);
    return NextResponse.json(
      { user: null, message: "Internal server error" },
      {
        status: 500,
      }
    );
  }
}
