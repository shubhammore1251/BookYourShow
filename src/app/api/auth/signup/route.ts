import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()
    if (!email || !password) return new Response("missing", { status: 400 })

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ success: false, message: "User with this email already exists" }, {
        status: 400,
      })
    }

    const hash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hash },
      select: { id: true, email: true, name: true },
    })

    return NextResponse.json({ success: true, message: "Signup successful"}, {
      status: 201,
    })
  } catch (err: any) {
    console.error(err)
    return new Response("server error", { status: 500 })
  }
}
