import { CacheService } from "./cache-service";
import prisma from "@/lib/prisma";
import axios from "axios";
import { NextResponse } from "next/server";

// export class ShowtimeService {
//   static async getShowtimes(query: {
//     movieId: number;
//     date: string;
//     location?: string;
//     showType?: string;
//   }) {
//     const { movieId, date, location = "all", showType = "all" } = query;

//     // Generate cache key
//     const cacheKey = `showtimes:${movieId}:${date}:${location}:${showType}`;
//     const cachedData = await CacheService.get(cacheKey);
//     if (cachedData) {
//       console.log("Cache HIT:", cacheKey);
//       const response = {
//         success: true,
//         cached: true,
//         data: cachedData,
//         message: "Showtimes fetched successfully",
//       };
//       return response;
//     }

//     console.log("Cache MISS:", cacheKey);

//     // --- 1️⃣ Fetch movie details from your existing API
//     let movie = null;

//     try {
//       const movieRes = await axios.get(
//         `${process.env.NEXT_PUBLIC_BASE_URL}/api/movies/${movieId}`
//       );
//       movie = movieRes.data?.data?.movieDetails || null;
//     } catch (error: any) {
//       if (axios.isAxiosError(error)) {
//         if (error.response?.status === 404) {
//           console.log("Movie not found");
//           return NextResponse.json(
//             { error: "Movie not found" },
//             { status: 404 }
//           );
//         }
//         console.error("Axios error:", error.message);
//       } else {
//         console.error("Unknown error fetching movie:", error);
//       }

//       // You can also return an error response if it's a different type of failure
//       return NextResponse.json(
//         { error: "Failed to fetch movie details" },
//         { status: 500 }
//       );
//     }

//     // --- 2️⃣ Construct date range (UTC midnight)
//     const startOfDay = new Date(date);
//     startOfDay.setUTCHours(0, 0, 0, 0);
//     const endOfDay = new Date(startOfDay);
//     endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

//     // --- 3️⃣ Build Prisma where clause
//     const whereClause: any = {
//       movieId,
//       date: {
//         gte: startOfDay,
//         lt: endOfDay,
//       },
//     };

//     if (showType !== "all") {
//       whereClause.language = {
//         equals: showType,
//         mode: "insensitive",
//       };
//     }

//     if (location !== "all") {
//       whereClause.screen = {
//         theater: {
//           location: {
//             contains: location,
//             mode: "insensitive",
//           },
//         },
//       };
//     }

//     // --- 4️⃣ Fetch shows along with theater & screen details
//     const shows = await prisma.show.findMany({
//       where: whereClause,
//       include: {
//         screen: {
//           include: {
//             theater: true,
//           },
//         },
//       },
//       orderBy: [
//         {
//           screen: {
//             theater: {
//               name: "asc",
//             },
//           },
//         },
//         {
//           startTime: "asc",
//         },
//       ],
//     });

//     // --- 5️⃣ Group by theater and screen
//     const theaters = Object.values(
//       shows.reduce((acc: any, show: any) => {
//         const theater = show.screen.theater;
//         if (!acc[theater.id]) {
//           acc[theater.id] = {
//             id: theater.id,
//             name: theater.name,
//             location: theater.location,
//             address: theater.address,
//             screens: {},
//           };
//         }

//         const screen = show.screen;
//         if (!acc[theater.id].screens[screen.id]) {
//           acc[theater.id].screens[screen.id] = {
//             id: screen.id,
//             name: screen.name,
//             type: screen.type,
//             shows: [],
//           };
//         }

//         acc[theater.id].screens[screen.id].shows.push({
//           id: show.id,
//           startTime: show.startTime,
//           endTime: show.endTime,
//           price: show.price,
//           language: show.language,
//         });

//         return acc;
//       }, {})
//     ).map((theater: any) => ({
//       ...theater,
//       screens: Object.values(theater.screens),
//     }));

//     const data = {
//       movie,
//       theaters,
//     };
//     // --- 7️⃣ Cache result
//     await CacheService.set(cacheKey, data, CacheService.TTL.SHOWTIMES);

//     // --- 6️⃣ Create response
//     const response = {
//       success: true,
//       cached: false,
//       data,
//       message: "Showtimes fetched successfully",
//     };
//     return response;
//   }
// }

export class ShowtimeService {
  static async getShowtimes(query: {
    movieId: number;
    date: string;
    location?: string;
    showType?: string;
  }) {
    const { movieId, date, location = "all", showType = "all" } = query;

    const cacheKey = `showtimes:${movieId}:${date}:${location}:${showType}`;
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      console.log("Cache HIT:", cacheKey);
      const response = {
        success: true,
        cached: true,
        data: cachedData,
        message: "Showtimes fetched successfully",
      };
      return response;
    }

    console.log("Cache MISS:", cacheKey);

    // --- 1️⃣ Fetch movie details from existing movie API
    let movie = null;
    try {
      const movieRes = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/movies/${movieId}`
      );
      movie = movieRes.data?.data?.movieDetails || null;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log("Movie not found");
        return NextResponse.json({ error: "Movie not found" }, { status: 404 });
      }
      console.error("Movie fetch error:", error.message);
      return NextResponse.json(
        { error: "Failed to fetch movie details" },
        { status: 500 }
      );
    }

    // --- 2️⃣ Construct date range
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    // --- 3️⃣ Build where clause
    const whereClause: any = {
      movieId,
      date: {
        gte: startOfDay,
        lt: endOfDay,
      },
    };

    if (showType !== "all") {
      whereClause.language = { equals: showType, mode: "insensitive" };
    }

    if (location !== "all") {
      whereClause.screen = {
        theater: {
          location: {
            contains: location,
            mode: "insensitive",
          },
        },
      };
    }

    // --- 4️⃣ Fetch all shows (with theater & screen)
    const shows = await prisma.show.findMany({
      where: whereClause,
      include: {
        screen: {
          include: {
            theater: true,
          },
        },
      },
      orderBy: [
        {
          screen: {
            theater: {
              name: "asc",
            },
          },
        },
        {
          startTime: "asc",
        },
      ],
    });

    // --- 5️⃣ Aggregate confirmed bookings per show
    const bookingSums = await prisma.booking.groupBy({
      by: ["showId"],
      _sum: { seatsBooked: true },
      where: {
        status: "CONFIRMED",
        showId: { in: shows.map((s:any) => s.id) },
      },
    });

    const bookingMap = bookingSums.reduce((acc:any, b:any) => {
      acc[b.showId] = b._sum.seatsBooked || 0;
      return acc;
    }, {} as Record<number, number>);

    // --- 6️⃣ Group shows by theater and screen
    const theaters = Object.values(
      shows.reduce((acc: any, show: any) => {
        const theater = show.screen.theater;

        if (!acc[theater.id]) {
          acc[theater.id] = {
            id: theater.id,
            name: theater.name,
            location: theater.location,
            address: theater.address,
            screens: {},
          };
        }

        const screen = show.screen;
        if (!acc[theater.id].screens[screen.id]) {
          acc[theater.id].screens[screen.id] = {
            id: screen.id,
            name: screen.name,
            type: screen.type,
            shows: [],
          };
        }

        const seatsBooked = bookingMap[show.id] || 0;
        const availableSeats = show.totalSeats - seatsBooked;

        acc[theater.id].screens[screen.id].shows.push({
          id: show.id,
          startTime: show.startTime,
          endTime: show.endTime,
          price: show.price,
          language: show.language,
          totalSeats: show.totalSeats,
          seatsBooked,
          availableSeats,
        });

        return acc;
      }, {})
    ).map((theater: any) => ({
      ...theater,
      screens: Object.values(theater.screens),
    }));

    const data = {
      movie,
      theaters,
    };
    // --- 7️⃣ Cache result
    await CacheService.set(cacheKey, data, CacheService.TTL.SHOWTIMES);

    // --- 6️⃣ Create response
    const response = {
      success: true,
      cached: false,
      data,
      message: "Showtimes fetched successfully",
    };
    return response;
  }
}
