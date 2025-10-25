import { ShowtimeService } from "@/services/showtime-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const movieId = Number(searchParams.get("movieId"));
    const date = searchParams.get("date")!;
    const location = searchParams.get("location") || "all";
    const showType = searchParams.get("showType") || "all";

    if (!movieId || !date) {
      return NextResponse.json(
        { success: false, error: "No movie ID or date provided" },
        { status: 400 }
      );
    }

    const data = await ShowtimeService.getShowtimes({
      movieId,
      date,
      location,
      showType,
    });

    // If service returned NextResponse directly
    if (data instanceof NextResponse) return data;

    console.log("Showtimes response:", data);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal Server Error",
        stack:
          process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}
