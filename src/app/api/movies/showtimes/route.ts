import { ShowtimeService } from '@/services/showtime-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const movieId = Number(searchParams.get('movieId'));
    const date = searchParams.get('date');
    const location = searchParams.get('location');
    const showType = searchParams.get('showType');

    // Validation
    if (!movieId || !date) {
      return NextResponse.json(
        { error: 'movieId and date are required parameters' },
        { status: 400 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const showtimes = await ShowtimeService.getShowtimes({
      movieId,
      date,
      location: location || undefined,
      showType: showType || undefined,
    });

    return NextResponse.json({
      success: true,
      data: showtimes,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}