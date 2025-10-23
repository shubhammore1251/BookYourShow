import {
  MovieInfo,
  ShowtimeQuery,
  ShowtimeResponse,
  TheaterShowtime,
} from "@/lib/types/movie";
import { CacheService } from "./cache-service";
import prisma from "@/lib/prisma";

// export class ShowtimeService {
//   static async getShowtimes(query: ShowtimeQuery): Promise<ShowtimeResponse> {
//     const { movieId, date, location = "all", showType = "all" } = query;

//     const cacheKey = CacheService.keys.showtimes(
//       movieId,
//       date,
//       location,
//       showType
//     );
//     const cached = await CacheService.get<ShowtimeResponse>(cacheKey);
//     if (cached) {
//       console.log("Cache HIT:", cacheKey);
//       return cached;
//     }

//     console.log("Cache MISS:", cacheKey);

//     const movie = await this.getMovieDetails(movieId);

//     const [shows, availableDates, showTypes] = await Promise.all([
//       this.fetchShows(
//         movieId,
//         date,
//         location !== "all" ? location : undefined,
//         showType !== "all" ? showType : undefined
//       ),
//       this.getAvailableDates(
//         movieId,
//         location !== "all" ? location : undefined
//       ),
//       this.getShowTypes(movieId),
//     ]);

//     console.log("Fetched shows count:", shows.length);

//     const theaterMap = new Map<number, TheaterShowtime>();

//     for (const show of shows) {
//       const theater = show.screen.theater;
//       const theaterId = theater.id;

//       if (!theaterMap.has(theaterId)) {
//         theaterMap.set(theaterId, {
//           id: theater.id,
//           name: theater.name,
//           location: theater.location,
//           address: theater.address,
//           features: [],
//           showtimes: [],
//         });
//       }

//       const theaterData = theaterMap.get(theaterId)!;
//       const availableSeats = show.totalSeats - show.seatsFilled;
//       const occupancyRate = (show.seatsFilled / show.totalSeats) * 100;

//       theaterData.showtimes.push({
//         id: show.id,
//         time: show.startTime,
//         showType: show.language,
//         screenType: Array.isArray(show.screen.type) ? show.screen.type : [],
//         price: show.price,
//         availableSeats,
//         totalSeats: show.totalSeats,
//         isAvailable: availableSeats > 0,
//         isFastFilling: occupancyRate > 70,
//       });

//       if (Array.isArray(show.screen.type)) {
//         show.screen.type.forEach((feature: string) => {
//           if (!theaterData.features.includes(feature)) {
//             theaterData.features.push(feature);
//           }
//         });
//       }
//     }

//     const response: ShowtimeResponse = {
//       movie,
//       availableDates,
//       showTypes,
//       theaters: Array.from(theaterMap.values()),
//     };

//     await CacheService.set(cacheKey, response, CacheService["TTL"].SHOWTIMES);
//     return response;
//   }

//   private static async getMovieDetails(
//     movieId: number
//   ): Promise<MovieInfo | null> {
//     try {
//       const baseUrl =
//         process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
//       const response = await fetch(`${baseUrl}/api/movies/${movieId}`, {
//         next: { revalidate: 3600 },
//       });

//       if (!response.ok) throw new Error("Failed to fetch movie details");
//       const data = await response.json();
//       const movie = data.data.movieDetails;

//       return {
//         id: movie.id,
//         title: movie.title,
//         runtime: movie.runtime || movie.duration,
//         rating: movie.rating || movie.certification,
//         genres: movie.genres || [],
//         posterUrl: movie.posterUrl || movie.poster,
//         language: movie.original_language,
//       };
//     } catch (error) {
//       console.error("Error fetching movie details:", error);
//       return null;
//     }
//   }

//   // ✅ UPDATED: Date-only filtering (ignore time)
//   // private static async fetchShows(
//   //   movieId: number,
//   //   date: string,
//   //   location?: string,
//   //   showType?: string
//   // ) {
//   //   // Convert passed date (e.g. "2025-10-23") to UTC range
//   //   const showDate = new Date(date);
//   //   showDate.setUTCHours(0, 0, 0, 0);

//   //   const nextDay = new Date(showDate);
//   //   nextDay.setUTCDate(nextDay.getUTCDate() + 1);

//   //   console.log("Fetching shows for:", { movieId, date, location, showType });
//   //   console.log("Date range:", { showDate, nextDay });
//   //   const whereClause: any = {
//   //     movieId,
//   //     startTime: {
//   //       gte: showDate.toISOString(), // ✅ FIXED: convert Date → string
//   //       lt: nextDay.toISOString(), // ✅ FIXED: convert Date → string
//   //     },
//   //   };

//   //   if (showType) whereClause.language = showType;

//   //   if (location) {
//   //     whereClause.screen = {
//   //       theater: {
//   //         location: {
//   //           contains: location,
//   //           mode: "insensitive",
//   //         },
//   //       },
//   //     };
//   //   }

//   //   console.log("Where clause:", JSON.stringify(whereClause, null, 2));

//   //   const shows = await prisma.show.findMany({
//   //     where: whereClause,
//   //     include: {
//   //       screen: { include: { theater: true } },
//   //     },
//   //     orderBy: [{ screen: { theater: { name: "asc" } } }, { startTime: "asc" }],
//   //   });

//   //   console.log("Found shows:", shows.length);
//   //   if (shows.length > 0) {
//   //     console.log("Sample show:", {
//   //       id: shows[0].id,
//   //       startTime: shows[0].startTime,
//   //       theater: shows[0].screen.theater.name,
//   //     });
//   //   }

//   //   return shows;
//   // }
//   private static async fetchShows(
//     movieId: number,
//     date: string,
//     location?: string,
//     showType?: string
//   ) {
//     const showDate = new Date(date);
//     showDate.setUTCHours(0, 0, 0, 0);

//     const nextDay = new Date(showDate);
//     nextDay.setUTCDate(nextDay.getUTCDate() + 1);

//     const whereClause: any = {
//       movieId,
//       startTime: {
//         gte: showDate.toISOString(),
//         lt: nextDay.toISOString(),
//       },
//     };

//     if (showType) {
//       whereClause.language = { equals: showType, mode: "insensitive" };
//     }

//     if (location) {
//       whereClause.screen = {
//         theater: {
//           location: { contains: location, mode: "insensitive" },
//         },
//       };
//     }

//     console.log("Where clause:", JSON.stringify(whereClause, null, 2));

//     const shows = await prisma.show.findMany({
//       where: whereClause,
//       include: {
//         screen: {
//           include: { theater: true },
//         },
//       },
//       orderBy: [{ screen: { theater: { name: "asc" } } }, { startTime: "asc" }],
//     });

//     console.log("Found shows:", shows.length);

//     if (shows.length > 0) {
//       console.log("Sample show:", {
//         id: shows[0].id,
//         startTime: shows[0].startTime,
//         theater: shows[0].screen.theater.name,
//         location: shows[0].screen.theater.location,
//       });
//     }

//     return shows;
//   }

//   private static async getAvailableDates(movieId: number, location?: string) {
//     const cacheKey = CacheService.keys.availableDates(
//       movieId,
//       location || "all"
//     );
//     const cached = await CacheService.get<string[]>(cacheKey);
//     if (cached) return cached;

//     const today = new Date();
//     today.setUTCHours(0, 0, 0, 0);

//     const shows = await prisma.show.findMany({
//       where: {
//         movieId,
//         startTime: { gte: today.toISOString() },
//         ...(location && {
//           screen: {
//             theater: {
//               location: { contains: location, mode: "insensitive" },
//             },
//           },
//         }),
//       },
//       select: { startTime: true },
//       distinct: ["startTime"],
//       orderBy: { startTime: "asc" },
//       take: 7,
//     });

//     const dates = shows
//       .map((s: any) => s.startTime?.split("T")[0])
//       .filter(Boolean);

//     await CacheService.set(
//       cacheKey,
//       dates,
//       CacheService["TTL"].AVAILABLE_DATES
//     );
//     return dates;
//   }

//   private static async getShowTypes(movieId: number) {
//     const cacheKey = CacheService.keys.showTypes(movieId);
//     const cached = await CacheService.get<string[]>(cacheKey);
//     if (cached) return cached;

//     const today = new Date();
//     today.setUTCHours(0, 0, 0, 0);

//     const shows = await prisma.show.findMany({
//       where: { movieId, startTime: { gte: today.toISOString() } },
//       select: { language: true },
//       distinct: ["language"],
//     });

//     const types = shows.map((s: any) => s.language);
//     await CacheService.set(cacheKey, types, CacheService["TTL"].SHOW_TYPES);
//     return types;
//   }

//   static async invalidateShowtimeCache(movieId: number, date?: string) {
//     const patterns = [`showtimes:${movieId}:*`, `dates:${movieId}:*`];
//     if (date) patterns.push(`showtimes:${movieId}:${date}:*`);
//     await Promise.all(patterns.map((p) => CacheService.invalidate(p)));
//   }

//   static async updateSeatAvailability(showId: number, seatsBooked: number) {
//     const show = await prisma.show.update({
//       where: { id: showId },
//       data: { seatsFilled: { increment: seatsBooked } },
//       include: { screen: { include: { theater: true } } },
//     });

//     const dateStr = new Date(show.startTime).toISOString().split("T")[0];
//     await this.invalidateShowtimeCache(show.movieId, dateStr);
//     return show;
//   }
// }
export class ShowtimeService {
  static async getShowtimes(query: ShowtimeQuery): Promise<ShowtimeResponse> {
    const { movieId, date, location = "all", showType = "all" } = query;

    const cacheKey = CacheService.keys.showtimes(
      movieId,
      date,
      location,
      showType
    );

    const cached = await CacheService.get<ShowtimeResponse>(cacheKey);
    if (cached) {
      console.log("Cache HIT:", cacheKey);
      return cached;
    }

    console.log("Cache MISS:", cacheKey);

    const movie = await this.getMovieDetails(movieId);

    const [shows, availableDates, showTypes] = await Promise.all([
      this.fetchShows(
        movieId,
        date,
        location !== "all" ? location : undefined,
        showType !== "all" ? showType : undefined
      ),
      this.getAvailableDates(
        movieId,
        location !== "all" ? location : undefined
      ),
      this.getShowTypes(movieId),
    ]);

    console.log("Fetched shows count:", shows.length);

    const theaterMap = new Map<number, TheaterShowtime>();

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

      const theaterData = theaterMap.get(theaterId)!;
      const availableSeats = show.totalSeats - show.seatsFilled;
      const occupancyRate = (show.seatsFilled / show.totalSeats) * 100;

      theaterData.showtimes.push({
        id: show.id,
        time: show.startTime,
        showType: show.language,
        screenType: Array.isArray(show.screen.type) ? show.screen.type : [],
        price: show.price,
        availableSeats,
        totalSeats: show.totalSeats,
        isAvailable: availableSeats > 0,
        isFastFilling: occupancyRate > 70,
      });

      if (Array.isArray(show.screen.type)) {
        show.screen.type.forEach((feature: string) => {
          if (!theaterData.features.includes(feature)) {
            theaterData.features.push(feature);
          }
        });
      }
    }

    const response: ShowtimeResponse = {
      movie,
      availableDates,
      showTypes,
      theaters: Array.from(theaterMap.values()),
    };

    await CacheService.set(cacheKey, response, CacheService.TTL.SHOWTIMES);
    return response;
  }

  private static async getMovieDetails(
    movieId: number
  ): Promise<MovieInfo | null> {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/movies/${movieId}`, {
        next: { revalidate: 3600 },
      });

      if (!response.ok) throw new Error("Failed to fetch movie details");
      const data = await response.json();
      const movie = data.data.movieDetails;

      return {
        id: movie.id,
        title: movie.title,
        runtime: movie.runtime || movie.duration,
        rating: movie.rating || movie.certification,
        genres: movie.genres || [],
        posterUrl: movie.posterUrl || movie.poster,
        language: movie.original_language,
      };
    } catch (error) {
      console.error("Error fetching movie details:", error);
      return null;
    }
  }

  private static async fetchShows(
    movieId: number,
    date: string,
    location?: string,
    showType?: string
  ) {
    // Convert passed date (YYYY-MM-DD) to UTC range
    const showDate = new Date(date);
    showDate.setUTCHours(0, 0, 0, 0);

    const nextDay = new Date(showDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    console.log("Fetching shows for:", { movieId, date, location, showType });
    console.log("Date range:", { showDate, nextDay });

    const whereClause: any = {
      movieId,
      startTime: {
        gte: showDate.toISOString(),
        lt: nextDay.toISOString(),
      },
    };

    if (showType) whereClause.language = showType;

    if (location) {
      // Directly filter the nested relation (screen -> theater)
      whereClause.screen = {
        theater: {
          location: {
            contains: location,
            mode: "insensitive",
          },
        },
      };
    }

    const shows = await prisma.show.findMany({
      where: whereClause,
      include: {
        screen: {
          include: { theater: true },
        },
      },
      orderBy: [{ screen: { theater: { name: "asc" } } }, { startTime: "asc" }],
    });

    console.log("Found shows:", shows.length);
    return shows;
  }

  // ✅ Get available dates for a movie (with optional location filter)
  private static async getAvailableDates(movieId: number, location?: string) {
    const cacheKey = CacheService.keys.availableDates(
      movieId,
      location || "all"
    );
    const cached = await CacheService.get<string[]>(cacheKey);
    if (cached) return cached;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const whereClause: any = {
      movieId,
      startTime: { gte: today.toISOString() },
    };

    if (location) {
      whereClause.screen = {
        theater: {
          location: { contains: location, mode: "insensitive" },
        },
      };
    }

    const shows = await prisma.show.findMany({
      where: whereClause,
      select: { startTime: true },
      distinct: ["startTime"], // Prisma v6 supports distinct on single fields
      orderBy: { startTime: "asc" },
      take: 7,
    });

    // Only map valid startTimes
    const dates = shows
      .map((s: any) => {
        if (!s.startTime) return null;
        const start: Date =
          s.startTime instanceof Date ? s.startTime : new Date(s.startTime);
        return isNaN(start.getTime())
          ? null
          : start.toISOString().split("T")[0];
      })
      .filter(Boolean);

    await CacheService.set(cacheKey, dates, CacheService.TTL.SHOWTIMES);
    return dates;
  }

  private static async getShowTypes(movieId: number) {
    const cacheKey = CacheService.keys.showTypes(movieId);
    const cached = await CacheService.get<string[]>(cacheKey);
    if (cached) return cached;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const shows = await prisma.show.findMany({
      where: { movieId, startTime: { gte: today.toISOString() } },
      select: { language: true },
      distinct: ["language"],
    });

    const types = shows.map((s: any) => s.language);
    await CacheService.set(cacheKey, types, CacheService.TTL.SHOW_TYPES);
    return types;
  }

  static async invalidateShowtimeCache(movieId: number, date?: string) {
    const patterns = [`showtimes:${movieId}:*`, `dates:${movieId}:*`];
    if (date) patterns.push(`showtimes:${movieId}:${date}:*`);
    await Promise.all(patterns.map((p) => CacheService.invalidate(p)));
  }

  static async updateSeatAvailability(showId: number, seatsBooked: number) {
    const show = await prisma.show.update({
      where: { id: showId },
      data: { seatsFilled: { increment: seatsBooked } },
      include: { screen: { include: { theater: true } } },
    });

    const dateStr = new Date(show.startTime).toISOString().split("T")[0];
    await this.invalidateShowtimeCache(show.movieId, dateStr);
    return show;
  }
}
