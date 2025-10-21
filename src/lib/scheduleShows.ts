import { PRICING_CONFIG, THEATER_TIME_SLOTS } from "./constants";
import prisma from "./prisma";
import { Movie } from "./types/movie";
import { DateTime } from "luxon";

// Fetch now playing movies from your API (with Redis cache)
async function fetchNowPlayingMovies(): Promise<Movie[]> {
  try {
    const allMovies: Movie[] = [];
    let currentPage = 1;
    let totalPages = 1;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Fetch first page to get total pages
    const firstResponse = await fetch(`${baseUrl}/api/movies?page=1`);

    if (!firstResponse.ok) {
      throw new Error("Failed to fetch movies from API");
    }

    const firstData = await firstResponse.json();
    totalPages = firstData.total_pages || 1;
    allMovies.push(...(firstData.data || []));

    console.log(`API returned ${totalPages} pages of now playing movies`);

    // Fetch remaining pages (limit to 10 pages max)
    const maxPages = Math.min(totalPages, 10);

    for (currentPage = 2; currentPage <= maxPages; currentPage++) {
      const response = await fetch(`${baseUrl}/api/movies?page=${currentPage}`);

      if (response.ok) {
        const data = await response.json();
        allMovies.push(...(data.data || []));
      }

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`Fetched total of ${allMovies.length} movies from API`);
    return allMovies;
  } catch (error) {
    console.error("Error fetching movies from API:", error);
    return [];
  }
}

// Calculate end time based on start time (assuming 2.5 hour movie duration)
function calculateEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);

  // Add 2.5 hours (150 minutes) for average movie duration
  startDate.setMinutes(startDate.getMinutes() + 150);

  const endHours = startDate.getHours().toString().padStart(2, "0");
  const endMinutes = startDate.getMinutes().toString().padStart(2, "0");

  return `${endHours}:${endMinutes}`;
}

// Get price based on time slot
function getPriceForTimeSlot(startTime: string): number {
  const [hours] = startTime.split(":").map(Number);

  if (hours < 12) return PRICING_CONFIG.morning;
  if (hours < 18) return PRICING_CONFIG.afternoon;
  if (hours < 21) return PRICING_CONFIG.evening;
  return PRICING_CONFIG.night;
}

// Delete expired shows
async function deleteExpiredShows() {
  const now = new Date();

  try {
    const deleted = await prisma.show.deleteMany({
      where: {
        OR: [
          {
            date: {
              lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            },
          },
          {
            AND: [
              {
                date: {
                  equals: new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate()
                  ),
                },
              },
              {
                startTime: {
                  lt: `${now.getHours().toString().padStart(2, "0")}:${now
                    .getMinutes()
                    .toString()
                    .padStart(2, "0")}`,
                },
              },
            ],
          },
        ],
      },
    });

    console.log(`Deleted ${deleted.count} expired shows`);
    return deleted.count;
  } catch (error) {
    console.error("Error deleting expired shows:", error);
    return 0;
  }
}

// Check if show exists for a screen on a specific date and time
async function showExists(
  screenId: number,
  date: Date,
  startTime: string
): Promise<boolean> {
  const existing = await prisma.show.findFirst({
    where: {
      screenId,
      date,
      startTime,
    },
  });

  console.log("Checking show existence for:", date, "timeSlot:", startTime);


  return !!existing;
}

// Generate shows for all theaters
// async function generateShows() {
//   const movies = await fetchNowPlayingMovies();

//   if (movies.length === 0) {
//     console.log("No movies found from TMDB");
//     return { created: 0, skipped: 0 };
//   }

//   console.log(`Found ${movies.length} movies from TMDB`);

//   // Fetch all theaters with their screens
//   const theaters = await prisma.theater.findMany({
//     include: {
//       screens: true,
//     },
//   });

//   console.log(`Found ${theaters.length} theaters`);

//   let createdCount = 0;
//   let skippedCount = 0;

//   // Generate shows for next 7 days
//   // for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
//   //   const showDateIST = DateTime.now()
//   //     .setZone("Asia/Kolkata")
//   //     .startOf("day")
//   //     .plus({ days: dayOffset });

//   //   const showDate = showDateIST.toUTC().toJSDate();

//   //   // For each theater
//   //   for (const theater of theaters) {
//   //     if (theater.screens.length === 0) continue;

//   //     // Get time slots for this theater (rotate through different patterns)
//   //     const timeSlotIndex = theater.id % Object.keys(THEATER_TIME_SLOTS).length;
//   //     const timeSlotKey = Object.keys(THEATER_TIME_SLOTS)[
//   //       timeSlotIndex
//   //     ] as keyof typeof THEATER_TIME_SLOTS;
//   //     const timeSlots = THEATER_TIME_SLOTS[timeSlotKey];

//   //     // For each time slot
//   //     for (const timeSlot of timeSlots) {
//   //       // Skip if it's today and the time has passed
//   //       if (dayOffset === 0) {
//   //         const nowIST = DateTime.now().setZone("Asia/Kolkata");
//   //         const [slotHours, slotMinutes] = timeSlot.split(":").map(Number);
//   //         const slotTime = nowIST.set({
//   //           hour: slotHours,
//   //           minute: slotMinutes,
//   //           second: 0,
//   //           millisecond: 0,
//   //         });
//   //         if (slotTime <= nowIST) continue;
//   //       }

//   //       // Randomly select a screen from this theater
//   //       const randomScreen =
//   //         theater.screens[Math.floor(Math.random() * theater.screens.length)];

//   //       // Check if show already exists
//   //       const exists = await showExists(randomScreen.id, showDate, timeSlot);

//   //       if (exists) {
//   //         skippedCount++;
//   //         continue;
//   //       }

//   //       // Randomly select a movie
//   //       const randomMovie = movies[Math.floor(Math.random() * movies.length)];

//   //       // Get supported languages for this screen (extract unique languages without format suffix)
//   //       const screenLanguages = randomScreen.type as Array<string>;
//   //       const availableLanguages = [
//   //         ...new Set(screenLanguages.map((lang) => lang.split("-")[0])),
//   //       ];

//   //       let movieLanguage = "Hindi"; // Default fallback

//   //       // Map of original language codes to language names
//   //       const languageMap: Record<string, string> = {
//   //         en: "English",
//   //         hi: "Hindi",
//   //         te: "Telugu",
//   //         ta: "Tamil",
//   //         kn: "Kannada",
//   //         ml: "Malayalam",
//   //         mr: "Marathi",
//   //         bn: "Bengali",
//   //         gu: "Gujarati",
//   //         pa: "Punjabi",
//   //       };

//   //       const originalLang = languageMap[randomMovie.original_language] || null;

//   //       // Priority 1: If original language is available in theater, use it
//   //       if (originalLang && availableLanguages.includes(originalLang)) {
//   //         movieLanguage = originalLang;
//   //       }
//   //       // Priority 2: For foreign/regional languages not available, fallback to English or Hindi
//   //       else {
//   //         // For English movies
//   //         if (
//   //           randomMovie.original_language === "en" &&
//   //           availableLanguages.includes("English")
//   //         ) {
//   //           movieLanguage = "English";
//   //         }
//   //         // For Hindi movies or if theater has Hindi
//   //         else if (
//   //           randomMovie.original_language === "hi" ||
//   //           availableLanguages.includes("Hindi")
//   //         ) {
//   //           movieLanguage = "Hindi";
//   //         }
//   //         // For other Indian regional languages (Telugu, Kannada, Tamil, etc.)
//   //         // If not available in theater, prefer Hindi over English for Indian audience
//   //         else if (
//   //           ["te", "ta", "kn", "ml", "mr", "bn", "gu", "pa"].includes(
//   //             randomMovie.original_language
//   //           )
//   //         ) {
//   //           if (availableLanguages.includes("Hindi")) {
//   //             movieLanguage = "Hindi";
//   //           } else if (availableLanguages.includes("English")) {
//   //             movieLanguage = "English";
//   //           }
//   //         }
//   //         // For foreign languages (Japanese, Korean, Chinese, etc.)
//   //         // Prefer English for international movies
//   //         else {
//   //           if (availableLanguages.includes("English")) {
//   //             movieLanguage = "English";
//   //           } else if (availableLanguages.includes("Hindi")) {
//   //             movieLanguage = "Hindi";
//   //           }
//   //         }
//   //       }

//   //       // Create the show
//   //       try {
//   //         await prisma.show.create({
//   //           data: {
//   //             movieId: randomMovie.id,
//   //             language: movieLanguage,
//   //             date: showDate,
//   //             startTime: timeSlot,
//   //             endTime: calculateEndTime(timeSlot),
//   //             screenId: randomScreen.id,
//   //             price: getPriceForTimeSlot(timeSlot),
//   //             seatsFilled: 0,
//   //             totalSeats: randomScreen.totalSeats,
//   //           },
//   //         });

//   //         createdCount++;
//   //       } catch (error) {
//   //         console.error(
//   //           `Error creating show for screen ${randomScreen.id}:`,
//   //           error
//   //         );
//   //         skippedCount++;
//   //       }
//   //     }
//   //   }
//   // }

//   for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
//     const showDateIST = DateTime.now()
//       .setZone("Asia/Kolkata")
//       .startOf("day")
//       .plus({ days: dayOffset });

//     const showDate = showDateIST.toJSDate(); // keep in IST

//     const todayIST = DateTime.now().setZone("Asia/Kolkata").startOf("day");
//     if (showDateIST < todayIST) continue; // skip any past dates

//     for (const theater of theaters) {
//       if (theater.screens.length === 0) continue;

//       const timeSlotIndex = theater.id % Object.keys(THEATER_TIME_SLOTS).length;
//       const timeSlotKey = Object.keys(THEATER_TIME_SLOTS)[
//         timeSlotIndex
//       ] as keyof typeof THEATER_TIME_SLOTS;
//       const timeSlots = THEATER_TIME_SLOTS[timeSlotKey];

//       for (const timeSlot of timeSlots) {
//         if (dayOffset === 0) {
//           const nowIST = DateTime.now().setZone("Asia/Kolkata");
//           const [slotHours, slotMinutes] = timeSlot.split(":").map(Number);
//           const slotTime = nowIST.set({
//             hour: slotHours,
//             minute: slotMinutes,
//             second: 0,
//             millisecond: 0,
//           });
//           if (slotTime <= nowIST) continue;
//         }

//         const randomScreen =
//           theater.screens[Math.floor(Math.random() * theater.screens.length)];

//         const exists = await showExists(randomScreen.id, showDate, timeSlot);
//         if (exists) continue;

//         const randomMovie = movies[Math.floor(Math.random() * movies.length)];
//         const screenLanguages = randomScreen.type as Array<string>;
//         const availableLanguages = [
//           ...new Set(screenLanguages.map((lang) => lang.split("-")[0])),
//         ];

//         const languageMap: Record<string, string> = {
//           en: "English",
//           hi: "Hindi",
//           te: "Telugu",
//           ta: "Tamil",
//           kn: "Kannada",
//           ml: "Malayalam",
//           mr: "Marathi",
//           bn: "Bengali",
//           gu: "Gujarati",
//           pa: "Punjabi",
//         };

//         const originalLang = languageMap[randomMovie.original_language] || null;
//         let movieLanguage = "Hindi";

//         if (originalLang && availableLanguages.includes(originalLang))
//           movieLanguage = originalLang;
//         else if (availableLanguages.includes("Hindi")) movieLanguage = "Hindi";
//         else if (availableLanguages.includes("English"))
//           movieLanguage = "English";

//         console.log(
//           "Generating for:",
//           showDateIST.toFormat("dd LLL yyyy HH:mm ZZZZ"),
//           "| Stored date:",
//           showDate
//         );

//         try {
//           await prisma.show.create({
//             data: {
//               movieId: randomMovie.id,
//               language: movieLanguage,
//               date: showDate,
//               startTime: timeSlot,
//               endTime: calculateEndTime(timeSlot),
//               screenId: randomScreen.id,
//               price: getPriceForTimeSlot(timeSlot),
//               seatsFilled: 0,
//               totalSeats: randomScreen.totalSeats,
//             },
//           });

//           createdCount++;
//         } catch (error) {
//           console.error(
//             `Error creating show for screen ${randomScreen.id}:`,
//             error
//           );
//           skippedCount++;
//         }
//       }
//     }
//   }

//   return { created: createdCount, skipped: skippedCount };
// }

async function generateShows() {
  const movies = await fetchNowPlayingMovies();

  if (movies.length === 0) {
    console.log("No movies found from TMDB");
    return { created: 0, skipped: 0 };
  }

  console.log(`Found ${movies.length} movies from TMDB`);

  const theaters = await prisma.theater.findMany({
    include: { screens: true },
  });

  console.log(`Found ${theaters.length} theaters`);

  let createdCount = 0;
  let skippedCount = 0;

  // Current IST date-time for comparison
  const nowIST = DateTime.now().setZone("Asia/Kolkata");

  // Generate shows for next 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const showDateIST = nowIST.startOf("day").plus({ days: dayOffset });

    // Skip past days (safety)
    if (showDateIST < nowIST.startOf("day")) continue;

    for (const theater of theaters) {
      if (theater.screens.length === 0) continue;

      const timeSlotIndex = theater.id % Object.keys(THEATER_TIME_SLOTS).length;
      const timeSlotKey = Object.keys(THEATER_TIME_SLOTS)[timeSlotIndex] as keyof typeof THEATER_TIME_SLOTS;
      const timeSlots = THEATER_TIME_SLOTS[timeSlotKey];

      for (const timeSlot of timeSlots) {
        const [slotHour, slotMinute] = timeSlot.split(":").map(Number);

        // Exact show start in IST
        const showStartIST = showDateIST.set({
          hour: slotHour,
          minute: slotMinute,
          second: 0,
          millisecond: 0,
        });

        // Skip past slots if today
        if (dayOffset === 0 && showStartIST <= nowIST) continue;

        // Convert to UTC for DB
        const showStartUTC = showStartIST.toUTC().toJSDate();
        const showEndTime = calculateEndTime(timeSlot);

        const randomScreen = theater.screens[Math.floor(Math.random() * theater.screens.length)];

        const exists = await prisma.show.findFirst({
          where: {
            screenId: randomScreen.id,
            date: showStartUTC,
            startTime: timeSlot,
          },
        });

        if (exists) {
          skippedCount++;
          continue;
        }

        const randomMovie = movies[Math.floor(Math.random() * movies.length)];

        // Determine movie language
        const screenLanguages = randomScreen.type as Array<string>;
        const availableLanguages = [...new Set(screenLanguages.map((lang) => lang.split("-")[0]))];

        const languageMap: Record<string, string> = {
          en: "English",
          hi: "Hindi",
          te: "Telugu",
          ta: "Tamil",
          kn: "Kannada",
          ml: "Malayalam",
          mr: "Marathi",
          bn: "Bengali",
          gu: "Gujarati",
          pa: "Punjabi",
        };

        const originalLang = languageMap[randomMovie.original_language] || null;
        let movieLanguage = "Hindi";

        if (originalLang && availableLanguages.includes(originalLang))
          movieLanguage = originalLang;
        else if (availableLanguages.includes("Hindi"))
          movieLanguage = "Hindi";
        else if (availableLanguages.includes("English"))
          movieLanguage = "English";

        // Create show in DB
        try {
          await prisma.show.create({
            data: {
              movieId: randomMovie.id,
              language: movieLanguage,
              date: showStartUTC,       // UTC-safe
              startTime: timeSlot,
              endTime: showEndTime,      // UTC-safe
              screenId: randomScreen.id,
              price: getPriceForTimeSlot(timeSlot),
              seatsFilled: 0,
              totalSeats: randomScreen.totalSeats,
            },
          });

          createdCount++;
        } catch (error) {
          console.error(`Error creating show for screen ${randomScreen.id}:`, error);
          skippedCount++;
        }
      }
    }
  }

  return { created: createdCount, skipped: skippedCount };
}

export { deleteExpiredShows, generateShows };
