import { ShowtimeQuery, ShowtimeResponse } from '@/lib/types/movie';
import { CacheService } from './cache-service';
import prisma from '@/lib/prisma';


export class ShowtimeService {
  static async getShowtimes(query: ShowtimeQuery): Promise<ShowtimeResponse> {
    const { movieId, date, location = 'all', showType = 'all' } = query;

    // Generate cache key
    const cacheKey = CacheService.keys.showtimes(movieId, date, location, showType);

    // Try cache first
    const cached = await CacheService.get<ShowtimeResponse>(cacheKey);
    if (cached) return cached;

    // Fetch from DB
    const [shows, availableDates, showTypes] = await Promise.all([
      this.fetchShows(movieId, date, location !== 'all' ? location : undefined, showType !== 'all' ? showType : undefined),
      this.getAvailableDates(movieId, location !== 'all' ? location : undefined),
      this.getShowTypes(movieId),
    ]);

    // Group by theater
    const theaterMap = new Map<number, any>();
    for (const show of shows) {
      const theater = show.screen.theater;
      const theaterId = theater.id;

      if (!theaterMap.has(theaterId)) {
        theaterMap.set(theaterId, {
          id: theater.id,
          name: theater.name,
          location: theater.location,
          address: theater.address,
          features: [],
          showtimes: [],
        });
      }

      const theaterData = theaterMap.get(theaterId);
      theaterData.showtimes.push({
        id: show.id,
        time: show.startTime,
        showType: show.language,
        price: show.price,
        availableSeats: show.totalSeats - show.seatsFilled,
        totalSeats: show.totalSeats,
        isAvailable: (show.totalSeats - show.seatsFilled) > 0,
        isFastFilling: ((show.seatsFilled / show.totalSeats) * 100) > 70,
        features: show.screen.type, // assuming features stored in Screen.type JSON
      });

      // Merge unique features
      const features = theaterData.features;
      show.screen.type.forEach((f: string) => {
        if (!features.includes(f)) features.push(f);
      });
    }

    const response: ShowtimeResponse = {
      availableDates,
      showTypes,
      theaters: Array.from(theaterMap.values()),
    };

    // Cache response
    await CacheService.set(cacheKey, response, 300);

    return response;
  }

  private static async fetchShows(
    movieId: number,
    date: string,
    location?: string,
    showType?: string
  ) {
    const showDate = new Date(date);
    showDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(showDate);
    nextDay.setDate(nextDay.getDate() + 1);

    return prisma.show.findMany({
      where: {
        movieId,
        date: { gte: showDate, lt: nextDay },
        ...(showType && { language: showType }),
        ...(location && { screen: { theater: { location: { contains: location, mode: 'insensitive' } } } }),
      },
      include: {
        screen: {
          include: {
            theater: true,
          },
        },
      },
      orderBy: [
        { screen: { theater: { name: 'asc' } } },
        { startTime: 'asc' },
      ],
    });
  }

  private static async getAvailableDates(movieId: number, location?: string) {
    const cacheKey = CacheService.keys.availableDates(movieId, location || 'all');
    const cached = await CacheService.get<string[]>(cacheKey);
    if (cached) return cached;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const shows = await prisma.show.findMany({
      where: {
        movieId,
        date: { gte: today },
        ...(location && { screen: { theater: { location: { contains: location, mode: 'insensitive' } } } }),
      },
      select: { date: true },
      distinct: ['date'],
      orderBy: { date: 'asc' },
      take: 7,
    });

    const dates = shows.map((s:any) => s.date.toISOString().split('T')[0]);
    await CacheService.set(cacheKey, dates, 600);
    return dates;
  }

  private static async getShowTypes(movieId: number) {
    const cacheKey = CacheService.keys.showTypes(movieId);
    const cached = await CacheService.get<string[]>(cacheKey);
    if (cached) return cached;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const shows = await prisma.show.findMany({
      where: { movieId, date: { gte: today } },
      select: { language: true },
      distinct: ['language'],
    });

    const types = shows.map((s:any) => s.language);
    await CacheService.set(cacheKey, types, 1800);
    return types;
  }

  static async invalidateShowtimeCache(movieId: number, date?: string) {
    const patterns = [`showtimes:${movieId}:*`, `dates:${movieId}:*`];
    if (date) patterns.push(`showtimes:${movieId}:${date}:*`);
    await Promise.all(patterns.map(p => CacheService.invalidate(p)));
  }

  static async updateSeatAvailability(showId: number, seatsBooked: number) {
    const show = await prisma.show.update({
      where: { id: showId },
      data: { seatsFilled: { increment: seatsBooked } },
      include: { screen: { include: { theater: true } } },
    });

    const occupancyRate = (show.seatsFilled / show.totalSeats) * 100;
    const isFastFilling = occupancyRate > 70;

    if (isFastFilling !== ((show.totalSeats - show.seatsFilled) / show.totalSeats > 0)) {
      await prisma.show.update({ where: { id: showId }, data: { /* update if you store isFastFilling */ } });
    }

    const dateStr = show.date.toISOString().split('T')[0];
    await this.invalidateShowtimeCache(show.movieId, dateStr);

    return show;
  }
}
