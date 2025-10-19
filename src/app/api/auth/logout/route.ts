import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { serialize } from "cookie"
import prisma from "@/lib/prisma"


export async function POST() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value

    if (token) {
      await prisma.session.deleteMany({ where: { sessionToken:  token } })
    }

    // clear cookie
    const clearCookie = serialize("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })

    return NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200, headers: { "Set-Cookie": clearCookie } }
    )
  } catch (err) {
    console.error("Logout error:", err)
    return NextResponse.json(
      { success: false, message: "Failed to logout" },
      { status: 500 }
    )
  }
}
