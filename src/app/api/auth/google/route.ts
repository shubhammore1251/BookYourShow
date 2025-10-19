import { NextRequest, NextResponse } from "next/server";
import { serialize } from "cookie";
import { sign } from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userInfo } = body;
    if (!userInfo?.email)
      return NextResponse.json({ error: "Email required" }, { status: 400 });

    const { email, name, picture } = userInfo;

    // upsert user
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        image: picture,
        emailVerified: true,
      },
      create: {
        email,
        name,
        image: picture,
        emailVerified: true,
      },
    });

    // create JWT token
    const token = sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // create session in DB
    await prisma.session.create({
      data: {
        userId: user.id,
        sessionToken: token,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    const cookie = serialize("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // use "lax" for better cross-site compatibility
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    delete user.password;
    

    return NextResponse.json(
      { success: true, message: "Login successful", data: user },
      { status: 200, headers: { "Set-Cookie": cookie } }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
