import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { serialize } from "cookie";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password)
    return new Response("Email or password missing", { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, password: true, image: true, emailVerified: true },
  });

  console.log("user", user);

  if (!user || !user.password)
    return NextResponse.json(
      { success: false, message: "Invalid credentials" },
      { status: 401 }
    );

  const match = await bcrypt.compare(password, user.password);
  if (!match)
    return NextResponse.json(
      { success: false, message: "Incorrect password" },
      { status: 401 }
    );

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  await prisma.session.create({
    data: {
      sessionToken: token,
      userId: user.id,
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
}
