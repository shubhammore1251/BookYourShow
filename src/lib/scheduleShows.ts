import { PRICING_CONFIG, THEATER_TIME_SLOTS } from "./constants";
import prisma from "./prisma";
import redis from "./redis";
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
// async function deleteExpiredShows() {
//   const now = new Date();

//   try {
//     const deleted = await prisma.show.deleteMany({
//       where: {
//         OR: [
//           {
//             date: {
//               lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
//             },
//           },
//           {
//             AND: [
//               {
//                 date: {
//                   equals: new Date(
//                     now.getFullYear(),
//                     now.getMonth(),
//                     now.getDate()
//                   ),
//                 },
//               },
//               {
//                 startTime: {
//                   lt: `${now.getHours().toString().padStart(2, "0")}:${now
//                     .getMinutes()
//                     .toString()
//                     .padStart(2, "0")}`,
//                 },
//               },
//             ],
//           },
//         ],
//       },
//     });

//     console.log(`Deleted ${deleted.count} expired shows`);
//     return deleted.count;
//   } catch (error) {
//     console.error("Error deleting expired shows:", error);
//     return 0;
//   }
// }
async function deleteExpiredShows() {
  const nowIST = DateTime.now().setZone("Asia/Kolkata");
  const todayDate = nowIST.startOf("day").toJSDate();
  const currentTime = nowIST.toFormat("HH:mm");

  try {
    const deleted = await prisma.show.deleteMany({
      where: {
        OR: [
          { date: { lt: todayDate } }, // older than today
          {
            AND: [
              { date: todayDate }, // same day but time passed
              { startTime: { lt: currentTime } },
            ],
          },
        ],
      },
    });

    console.log(`🗑️ Deleted ${deleted.count} expired shows`);
    return deleted.count;
  } catch (err) {
    console.error("❌ Error deleting expired shows:", err);
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

//   const theaters = await prisma.theater.findMany({
//     include: { screens: true },
//   });

//   console.log(`Found ${theaters.length} theaters`);

//   let createdCount = 0;
//   let skippedCount = 0;

//   // Current IST date-time for comparison
//   const nowIST = DateTime.now().setZone("Asia/Kolkata");

//   // Generate shows for next 7 days
//   for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
//     const showDateIST = nowIST.startOf("day").plus({ days: dayOffset });

//     // Skip past days (safety)
//     if (showDateIST < nowIST.startOf("day")) continue;

//     for (const theater of theaters) {
//       if (theater.screens.length === 0) continue;

//       const timeSlotIndex = theater.id % Object.keys(THEATER_TIME_SLOTS).length;
//       const timeSlotKey = Object.keys(THEATER_TIME_SLOTS)[timeSlotIndex] as keyof typeof THEATER_TIME_SLOTS;
//       const timeSlots = THEATER_TIME_SLOTS[timeSlotKey];

//       for (const timeSlot of timeSlots) {
//         const [slotHour, slotMinute] = timeSlot.split(":").map(Number);

//         // Exact show start in IST
//         const showStartIST = showDateIST.set({
//           hour: slotHour,
//           minute: slotMinute,
//           second: 0,
//           millisecond: 0,
//         });

//         // Skip past slots if today
//         if (dayOffset === 0 && showStartIST <= nowIST) continue;

//         // Convert to UTC for DB
//         const showStartUTC = showStartIST.toUTC().toJSDate();
//         const showEndTime = calculateEndTime(timeSlot);

//         const randomScreen = theater.screens[Math.floor(Math.random() * theater.screens.length)];

//         const exists = await prisma.show.findFirst({
//           where: {
//             screenId: randomScreen.id,
//             date: showStartUTC,
//             startTime: timeSlot,
//           },
//         });

//         if (exists) {
//           skippedCount++;
//           continue;
//         }

//         const randomMovie = movies[Math.floor(Math.random() * movies.length)];

//         // Determine movie language
//         const screenLanguages = randomScreen.type as Array<string>;
//         const availableLanguages = [...new Set(screenLanguages.map((lang) => lang.split("-")[0]))];

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
//         else if (availableLanguages.includes("Hindi"))
//           movieLanguage = "Hindi";
//         else if (availableLanguages.includes("English"))
//           movieLanguage = "English";

//         // Create show in DB
//         try {
//           await prisma.show.create({
//             data: {
//               movieId: randomMovie.id,
//               language: movieLanguage,
//               date: showStartUTC,       // UTC-safe
//               startTime: timeSlot,
//               endTime: showEndTime,      // UTC-safe
//               screenId: randomScreen.id,
//               price: getPriceForTimeSlot(timeSlot),
//               seatsFilled: 0,
//               totalSeats: randomScreen.totalSeats,
//             },
//           });

//           createdCount++;
//         } catch (error) {
//           console.error(`Error creating show for screen ${randomScreen.id}:`, error);
//           skippedCount++;
//         }
//       }
//     }
//   }

//   return { created: createdCount, skipped: skippedCount };
// }

// async function generateShows() {
//   const movies = await fetchNowPlayingMovies();
//   if (movies.length === 0) {
//     console.log("No movies found from TMDB");
//     return { created: 0, skipped: 0 };
//   }

//   console.log(`🎬 Found ${movies.length} movies from TMDB`);

//   const theaters = await prisma.theater.findMany({
//     include: { screens: true },
//   });

//   console.log(`🏛 Found ${theaters.length} theaters`);

//   let createdCount = 0;
//   let skippedCount = 0;

//   const nowIST = DateTime.now().setZone("Asia/Kolkata");

//   // Create shows for next 7 days
//   for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
//     const showDateIST = nowIST.startOf("day").plus({ days: dayOffset });
//     if (showDateIST < nowIST.startOf("day")) continue;

//     for (const theater of theaters) {
//       if (theater.screens.length === 0) continue;

//       const timeSlotIndex = theater.id % Object.keys(THEATER_TIME_SLOTS).length;
//       const slotKey = Object.keys(THEATER_TIME_SLOTS)[timeSlotIndex] as keyof typeof THEATER_TIME_SLOTS;
//       const timeSlots = THEATER_TIME_SLOTS[slotKey];

//       for (const screen of theater.screens) {
//         const screenTypes = Array.isArray(screen.type) ? screen.type : [];

//         for (const screenType of screenTypes) {
//           // Example: "Hindi-2D", "English-3D"
//           for (const timeSlot of timeSlots) {
//             const [hour, minute] = timeSlot.split(":").map(Number);
//             const showStartIST = showDateIST.set({
//               hour,
//               minute,
//               second: 0,
//               millisecond: 0,
//             });

//             // Skip past times for today
//             if (dayOffset === 0 && showStartIST <= nowIST) continue;

//             const showStartUTC = showStartIST.toUTC().toJSDate();
//             const showEndUTC = calculateEndTime(timeSlot);
//             const [language, dimension] = screenType.split("-");

//             // Avoid duplicate shows
//             const existing = await prisma.show.findFirst({
//               where: {
//                 screenId: screen.id,
//                 date: showStartUTC,
//                 startTime: timeSlot,
//                 language: screenType,
//               },
//             });

//             if (existing) {
//               skippedCount++;
//               continue;
//             }

//             // Random movie selection (try to balance)
//             const randomMovie = movies[Math.floor(Math.random() * movies.length)];

//             try {
//               await prisma.show.create({
//                 data: {
//                   movieId: randomMovie.id,
//                   language: screenType, // "Hindi-2D" etc.
//                   date: showStartUTC,
//                   startTime: timeSlot,
//                   endTime: showEndUTC,
//                   screenId: screen.id,
//                   price: getPriceForTimeSlot(timeSlot),
//                   seatsFilled: 0,
//                   totalSeats: screen.totalSeats,
//                 },
//               });
//               createdCount++;
//             } catch (err) {
//               console.error(`❌ Error creating show for screen ${screen.id}`, err);
//               skippedCount++;
//             }
//           }
//         }
//       }
//     }
//   }

//   console.log(`✅ Shows created: ${createdCount}, Skipped: ${skippedCount}`);
//   return { created: createdCount, skipped: skippedCount };
// }

/**
 * Config
 */
const DAYS_AHEAD = 7;
const MIN_SHOWS_PER_MOVIE_PER_DAY = 1; // baseline replication per day (can tune)
const REDIS_LOCK_KEY = "generateShows:lock";
const REDIS_LOCK_TTL = 60 * 5; // seconds (5 minutes) - lock expiry
const MOVIE_USAGE_HASH = "generateShows:movieUsage"; // Redis hash to track usage
const MAX_ASSIGN_ATTEMPTS = 8;

/**
 * Helpers
 */
function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function weightedRepeat<T extends { weight?: number }>(
  items: T[],
  minLength = 0
) {
  // Each item gets repeated proportional to weight (default 1).
  const expanded: T[] = [];
  const normalized = items.map((it) => ({
    it,
    w: Math.max(1, it.weight ?? 1),
  }));
  for (const { it, w } of normalized) {
    for (let i = 0; i < w; i++) expanded.push(it);
    if (expanded.length >= minLength) break;
  }
  // if still shorter than minLength, repeat items until minLength
  while (expanded.length < minLength && items.length) {
    for (const it of items) {
      expanded.push(it);
      if (expanded.length >= minLength) break;
    }
  }
  return shuffle(expanded);
}

/**
 * Acquire simple Redis lock (SET NX)
 */
async function acquireLock(): Promise<boolean> {
  const res = await (redis.set as any)(
    REDIS_LOCK_KEY,
    "1",
    "NX",
    "EX",
    REDIS_LOCK_TTL
  );
  return res === "OK";
}
async function releaseLock(): Promise<void> {
  await redis.del(REDIS_LOCK_KEY);
}

/**
 * Main function
 */

type SlotKey = keyof typeof THEATER_TIME_SLOTS; // "default" | "alternate1" | "alternate2" | "alternate3"

// async function generateShowsOptimized() {
//   // 1) Try to acquire lock
//   const gotLock = await acquireLock();
//   if (!gotLock) {
//     console.log("generateShows: another runner is active. Exiting.");
//     return { created: 0, skipped: 0, reason: "locked" };
//   }

//   try {
//     // 2) Fetch movies (from TMDB)
//     const movies = await fetchNowPlayingMovies();
//     if (!movies || movies.length === 0) {
//       console.log("No movies found from TMDB");
//       return { created: 0, skipped: 0 };
//     }

//     // Attach a weight for popularity (use vote_average or popularity field)
//     const moviesWithWeight = movies.map((m: any) => ({
//       ...m,
//       weight: Math.max(1, Math.round((m?.vote_average ?? 1) * 2)), // example weighting
//     }));

//     // 3) Fetch theaters + screens once
//     const theaters = await prisma.theater.findMany({
//       include: { screens: true },
//     });

//     // 4) Precompute date ranges for next DAYS_AHEAD days (IST) and corresponding UTC range
//     const nowIST = DateTime.now().setZone("Asia/Kolkata");
//     const dayInfos = [];
//     for (let d = 0; d < DAYS_AHEAD; d++) {
//       const dayStartIST = nowIST.startOf("day").plus({ days: d });
//       const dayEndIST = dayStartIST.endOf("day");
//       dayInfos.push({
//         dayOffset: d,
//         startIST: dayStartIST,
//         endIST: dayEndIST,
//         startUTC: dayStartIST.toUTC().toJSDate(),
//         endUTC: dayEndIST.toUTC().toJSDate(),
//       });
//     }

//     // 5) Batch-load existing shows for the full window (single query)
//     const allExistingShows = await prisma.show.findMany({
//       where: {
//         date: {
//           gte: dayInfos[0].startUTC,
//           lte: dayInfos[dayInfos.length - 1].endUTC,
//         },
//       },
//       select: {
//         id: true,
//         screenId: true,
//         date: true,
//         startTime: true,
//         language: true,
//       },
//     });

//     // Build an in-memory set for quick duplicate checks: key = `${screenId}|${dateISO}|${startTime}`
//     const existingSet = new Set<string>();
//     for (const s of allExistingShows) {
//       // Normalize date to ISO-date string in IST day boundary? We'll use show.date.toISOString() for exact match.
//       // Because we store date as UTC Date object representing exact show start, use its toISOString()
//       existingSet.add(`${s.screenId}|${s.date.toISOString()}|${s.startTime}`);
//     }

//     // 6) Prepare a long weighted queue for movie assignment
//     // Estimate totalSlots = sum of (screens * timeslots per day) across theaters and days
//     let totalSlots = 0;
//     for (const theater of theaters) {
//       const slotKey: SlotKey = Object.keys(THEATER_TIME_SLOTS)[
//         theater.id % Object.keys(THEATER_TIME_SLOTS).length
//       ] as SlotKey;
//       const tslots = THEATER_TIME_SLOTS[slotKey] ?? [];
//       for (const screen of theater.screens)
//         totalSlots += tslots.length * DAYS_AHEAD;
//     }

//     // Build weighted queue length >= totalSlots (and at least MIN_SHOWS_PER_MOVIE_PER_DAY per movie)
//     const baselinePerMovie = MIN_SHOWS_PER_MOVIE_PER_DAY * DAYS_AHEAD;
//     const minQueueLength = Math.max(
//       totalSlots,
//       baselinePerMovie * movies.length
//     );
//     const movieQueue = weightedRepeat(moviesWithWeight, minQueueLength);

//     // Persisted usage counts in Redis (hash)
//     // ensure the redis hash has keys for movies (optional)
//     // We'll read existing usage counts to prefer less-used movies
//     const persistedUsage = await redis.hgetall(MOVIE_USAGE_HASH);
//     const usageCounts: Record<string, number> = {};
//     for (const m of movies) {
//       usageCounts[m.id] = parseInt(persistedUsage[m.id] || "0", 10);
//     }

//     // 7) Sort timeslots for deterministic order (morning->night)
//     // We'll compute per-theater timeslotKey once
//     const theaterSlotMap: Record<number, string[]> = {};
//     for (const theater of theaters) {
//       // const slotKey: = Object.keys(THEATER_TIME_SLOTS)[theater.id % Object.keys(THEATER_TIME_SLOTS).length];
//       // const tslots = [...(THEATER_TIME_SLOTS[slotKey] ?? [])].sort((a, b) => parseInt(a.replace(":", "")) - parseInt(b.replace(":", "")));

//       const slotKey = Object.keys(THEATER_TIME_SLOTS)[
//         theater.id % Object.keys(THEATER_TIME_SLOTS).length
//       ] as SlotKey;

//       const tslots = [...(THEATER_TIME_SLOTS[slotKey] ?? [])].sort(
//         (a, b) => parseInt(a.replace(":", "")) - parseInt(b.replace(":", ""))
//       );

//       theaterSlotMap[theater.id] = tslots;
//     }

//     // 8) Batch create list to insert (we'll create in smaller batches)
//     const toCreate: Array<any> = []; // collect create objects

//     // Helper: choose movie from queue with bias for lower usage
//     function pickMoviePreferLowUsage(attemptsLeft = 6): any {
//       // sample few random candidates and pick the one with lowest usage
//       const sampleCount = Math.min(6, movieQueue.length);
//       let best = null;
//       let bestScore = Number.POSITIVE_INFINITY;
//       for (let s = 0; s < sampleCount; s++) {
//         const idx = Math.floor(Math.random() * movieQueue.length);
//         const candidate = movieQueue[idx];
//         const usage = usageCounts[candidate.id] ?? 0;
//         if (usage < bestScore) {
//           best = candidate;
//           bestScore = usage;
//         }
//       }
//       // fallback: random
//       return best ?? movieQueue[Math.floor(Math.random() * movieQueue.length)];
//     }

//     // 9) Core assignment loop (days -> theaters -> screens -> timeslots)
//     for (const dayInfo of dayInfos) {
//       const { dayOffset, startIST } = dayInfo;

//       for (const theater of theaters) {
//         const timeSlots = theaterSlotMap[theater.id];
//         if (!timeSlots || timeSlots.length === 0) continue;

//         for (const screen of theater.screens) {
//           const screenTypes: string[] = Array.isArray(screen.type)
//             ? screen.type
//             : [];
//           if (screenTypes.length === 0) continue;

//           let lastMovieOnScreen: number | null = null;

//           for (const timeSlot of timeSlots) {
//             const [hour, minute] = timeSlot.split(":").map(Number);
//             const showStartIST = startIST.set({
//               hour,
//               minute,
//               second: 0,
//               millisecond: 0,
//             });

//             // skip today's past times
//             if (dayOffset === 0 && showStartIST <= nowIST) continue;

//             const showStartUTC = showStartIST.toUTC().toJSDate();
//             const showStartISO = showStartUTC.toISOString();
//             const endTimeStr = calculateEndTime(timeSlot);

//             // Prevent duplicate if exists (from existing DB)
//             const existKey = `${screen.id}|${showStartISO}|${timeSlot}`;
//             if (existingSet.has(existKey)) continue;

//             // Also prevent duplicates created in this run
//             const inRunKey = `run|${existKey}`;
//             if (existingSet.has(inRunKey)) continue;

//             // Choose movie / screenType
//             let assignedMovie = null;
//             let assignedScreenType = null;

//             // Attempt selection MAX_ASSIGN_ATTEMPTS times
//             let attempts = 0;
//             while (attempts < MAX_ASSIGN_ATTEMPTS && !assignedMovie) {
//               const candidate = pickMoviePreferLowUsage();
//               attempts++;

//               // avoid immediate repeat on same screen
//               if (candidate.id === lastMovieOnScreen) continue;

//               // prefer screen type matching original language
//               const langMap: Record<string, string> = {
//                 en: "English",
//                 hi: "Hindi",
//                 te: "Telugu",
//                 ta: "Tamil",
//                 kn: "Kannada",
//                 ml: "Malayalam",
//                 mr: "Marathi",
//                 bn: "Bengali",
//                 gu: "Gujarati",
//                 pa: "Punjabi",
//               };
//               const movieLang = langMap[candidate.original_language] || null;
//               let preferredType = movieLang
//                 ? screenTypes.find((t) =>
//                     t.toLowerCase().startsWith(movieLang.toLowerCase())
//                   )
//                 : undefined;
//               if (!preferredType) preferredType = screenTypes[0];

//               // Check: avoid same movie in same theater & start time (optional but useful)
//               const keyTheaterDuplicate = `${theater.id}|${candidate.id}|${showStartISO}|${timeSlot}`;
//               // We can't query DB for each candidate (heavy) — we check in existingSet for screens in this theater at same time:
//               let dupFound = false;
//               for (const s of allExistingShows) {
//                 // quick check: if show starts at same ISO and movieId matches and screen belongs to same theater
//                 if (
//                   s.date.toISOString() === showStartISO &&
//                   s.movieId === candidate.id
//                 ) {
//                   // we don't have theater mapping in s, skip DB-heavy check; best-effort avoid duplicate by usage bias instead
//                   dupFound = true;
//                   break;
//                 }
//               }
//               if (dupFound) continue;

//               // Accept candidate
//               assignedMovie = candidate;
//               assignedScreenType = preferredType;
//             } // attempts

//             if (!assignedMovie) {
//               // fallback: pick any movie not equal to lastMovieOnScreen
//               assignedMovie =
//                 movies.find((m) => m.id !== lastMovieOnScreen) || movies[0];
//               assignedScreenType = screenTypes[0];
//             }

//             // push to batch creates
//             toCreate.push({
//               movieId: assignedMovie.id,
//               language: assignedScreenType,
//               date: showStartUTC,
//               startTime: timeSlot,
//               endTime: endTimeStr,
//               screenId: screen.id,
//               price: getPriceForTimeSlot(timeSlot),
//               seatsFilled: 0,
//               totalSeats: screen.totalSeats,
//             });

//             // mark as used in memory
//             existingSet.add(inRunKey);
//             lastMovieOnScreen = assignedMovie.id;
//             usageCounts[assignedMovie.id] =
//               (usageCounts[assignedMovie.id] || 0) + 1;
//           } // timeslots
//         } // screens
//       } // theaters
//     } // days

//     // 10) Bulk insert in small batches to avoid huge transactions
//     const BATCH_SIZE = 200;
//     let created = 0;
//     for (let i = 0; i < toCreate.length; i += BATCH_SIZE) {
//       const batch = toCreate.slice(i, i + BATCH_SIZE);
//       try {
//         await prisma.show.createMany({
//           data: batch.map((b) => ({
//             movieId: b.movieId,
//             language: b.language,
//             date: b.date,
//             startTime: b.startTime,
//             endTime: b.endTime,
//             screenId: b.screenId,
//             price: b.price,
//             seatsFilled: b.seatsFilled,
//             totalSeats: b.totalSeats,
//           })),
//           skipDuplicates: true, // safe-guard
//         });
//         created += batch.length;
//       } catch (err) {
//         console.error("Batch create error:", err);
//         // in case createMany fails, fallback to single creates for that batch (slow but safe)
//         for (const b of batch) {
//           try {
//             await prisma.show.create({ data: b });
//             created++;
//           } catch (err2) {
//             console.error("Single create fallback error:", err2);
//           }
//         }
//       }
//     }

//     // 11) Persist updated usageCounts to Redis (HSET)
//     const multi = redis.multi();
//     for (const [mid, count] of Object.entries(usageCounts)) {
//       multi.hset(MOVIE_USAGE_HASH, mid, String(count));
//     }
//     await multi.exec();

//     console.log(
//       `✅ generateShows completed: created ~${created}, planned: ${toCreate.length}`
//     );
//     return { created: created, planned: toCreate.length };
//   } finally {
//     // always release lock
//     await releaseLock();
//   }
// }

async function generateShowsOptimized() {
  const gotLock = await acquireLock();
  if (!gotLock) {
    console.log("generateShows: another runner is active. Exiting.");
    return { created: 0, skipped: 0, reason: "locked" };
  }

  try {
    await deleteExpiredShows();

    const movies = await fetchNowPlayingMovies();
    if (!movies.length) return { created: 0, skipped: 0 };

    const moviesWithWeight = movies.map((m: any) => ({
      ...m,
      weight: Math.max(1, Math.round((m?.vote_average ?? 1) * 2)),
    }));

    const theaters = await prisma.theater.findMany({ include: { screens: true } });
    if (!theaters.length) return { created: 0, skipped: 0 };

    const nowIST = DateTime.now().setZone("Asia/Kolkata");
    const dayInfos = [];
    for (let d = 0; d < DAYS_AHEAD; d++) {
      const dayStartIST = nowIST.startOf("day").plus({ days: d });
      dayInfos.push({
        dayOffset: d,
        startIST: dayStartIST,
        startUTC: dayStartIST.toUTC().toJSDate(),
        endUTC: dayStartIST.endOf("day").toUTC().toJSDate(),
      });
    }

    // Preload existing shows for quick duplicate checks
    const allExistingShows = await prisma.show.findMany({
      where: {
        date: { gte: dayInfos[0].startUTC, lte: dayInfos[DAYS_AHEAD - 1].endUTC },
      },
      select: { id: true, screenId: true, date: true, startTime: true, language: true },
    });
    const existingSet = new Set<string>();
    for (const s of allExistingShows) existingSet.add(`${s.screenId}|${s.date.toISOString()}|${s.startTime}|${s.language}`);

    // Build weighted movie queue
    let totalSlots = 0;
    for (const theater of theaters) {
      const slotKey: SlotKey = Object.keys(THEATER_TIME_SLOTS)[theater.id % Object.keys(THEATER_TIME_SLOTS).length] as SlotKey;
      const tslots = THEATER_TIME_SLOTS[slotKey] ?? [];
      for (const screen of theater.screens) totalSlots += tslots.length * DAYS_AHEAD;
    }
    const baselinePerMovie = MIN_SHOWS_PER_MOVIE_PER_DAY * DAYS_AHEAD;
    const minQueueLength = Math.max(totalSlots, baselinePerMovie * movies.length);
    const movieQueue = weightedRepeat(moviesWithWeight, minQueueLength);

    // Redis usage counts
    const persistedUsage = await redis.hgetall(MOVIE_USAGE_HASH);
    const usageCounts: Record<string, number> = {};
    for (const m of movies) usageCounts[m.id] = parseInt(persistedUsage[m.id] || "0", 10);

    // Precompute theater timeslots
    const theaterSlotMap: Record<number, string[]> = {};
    for (const theater of theaters) {
      const slotKey: SlotKey = Object.keys(THEATER_TIME_SLOTS)[theater.id % Object.keys(THEATER_TIME_SLOTS).length] as SlotKey;
      const tslots = [...(THEATER_TIME_SLOTS[slotKey] ?? [])].sort((a, b) => parseInt(a.replace(":", "")) - parseInt(b.replace(":", "")));
      theaterSlotMap[theater.id] = tslots;
    }

    const toCreate: any[] = [];

    function pickMoviePreferLowUsage() {
      const sample = 6;
      let best: any = null;
      let bestScore = Infinity;
      for (let i = 0; i < sample; i++) {
        const candidate = movieQueue[Math.floor(Math.random() * movieQueue.length)];
        const usage = usageCounts[candidate.id] || 0;
        if (usage < bestScore) {
          best = candidate;
          bestScore = usage;
        }
      }
      return best ?? movieQueue[Math.floor(Math.random() * movieQueue.length)];
    }

    const langMap: Record<string, string> = {
      en: "English", hi: "Hindi", te: "Telugu", ta: "Tamil",
      kn: "Kannada", ml: "Malayalam", mr: "Marathi", bn: "Bengali",
      gu: "Gujarati", pa: "Punjabi",
    };

    // Core loop: days -> theaters -> screens -> timeslots -> screenTypes
    for (const dayInfo of dayInfos) {
      const { dayOffset, startIST } = dayInfo;
      for (const theater of theaters) {
        const timeSlots = theaterSlotMap[theater.id];
        if (!timeSlots?.length) continue;

        for (const screen of theater.screens) {
          const screenTypes: string[] = Array.isArray(screen.type) ? screen.type : [];
          if (!screenTypes.length) continue;

          let lastMovieId: number | null = null;

          for (const timeSlot of timeSlots) {
            const [hour, minute] = timeSlot.split(":").map(Number);
            const showStartIST = startIST.set({ hour, minute });
            if (dayOffset === 0 && showStartIST <= nowIST) continue;

            const showStartUTC = showStartIST.toUTC().toJSDate();
            const showStartISO = showStartUTC.toISOString();
            const endTimeStr = calculateEndTime(timeSlot);

            for (const screenType of screenTypes) {
              const existKey = `${screen.id}|${showStartISO}|${timeSlot}|${screenType}`;
              if (existingSet.has(existKey)) continue;

              // pick movie
              let movie: any = null;
              let attempts = 0;
              while (attempts < MAX_ASSIGN_ATTEMPTS && !movie) {
                attempts++;
                const candidate = pickMoviePreferLowUsage();
                if (candidate.id === lastMovieId) continue;

                const movieLang = langMap[candidate.original_language] || null;
                if (movieLang && screenType.toLowerCase().startsWith(movieLang.toLowerCase())) {
                  movie = candidate;
                } else if (!movie) movie = candidate;
              }
              if (!movie) movie = pickMoviePreferLowUsage();

              // assign show
              toCreate.push({
                movieId: movie.id,
                language: screenType,
                date: showStartUTC,
                startTime: timeSlot,
                endTime: endTimeStr,
                screenId: screen.id,
                price: getPriceForTimeSlot(timeSlot),
                seatsFilled: 0,
                totalSeats: screen.totalSeats,
              });

              existingSet.add(existKey);
              lastMovieId = movie.id;
              usageCounts[movie.id] = (usageCounts[movie.id] || 0) + 1;
            }
          }
        }
      }
    }

    // Bulk insert in batches
    const BATCH_SIZE = 200;
    let created = 0;
    for (let i = 0; i < toCreate.length; i += BATCH_SIZE) {
      const batch = toCreate.slice(i, i + BATCH_SIZE);
      try {
        await prisma.show.createMany({ data: batch, skipDuplicates: true });
        created += batch.length;
      } catch (err) {
        console.error("Batch create error:", err);
        for (const b of batch) {
          try { await prisma.show.create({ data: b }); created++; } catch {}
        }
      }
    }

    // Persist usage counts
    const multi = redis.multi();
    for (const [mid, count] of Object.entries(usageCounts)) multi.hset(MOVIE_USAGE_HASH, mid, String(count));
    await multi.exec();

    console.log(`✅ generateShows completed: created ~${created}, planned: ${toCreate.length}`);
    return { created, planned: toCreate.length };
  } finally {
    await releaseLock();
  }
}

export { deleteExpiredShows, generateShowsOptimized };
