import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";
import { tmdb } from "@/lib/tmdb";

const genreMap: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const posterBase = "https://image.tmdb.org/t/p/w500";

// Supported languages
const languages = ["hi", "mr", "en"];

// export async function fetchTmdbNowPlayingIndia(page = 1) {
//   const today = new Date().toISOString().split("T")[0];
//   const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // last 30 days
//     .toISOString()
//     .split("T")[0];

//   const res = await tmdb.get("/discover/movie", {
//     params: {
//       region: "IN",
//       with_release_type: "2|3",
//       "release_date.gte": past,
//       "release_date.lte": today,
//       sort_by: "popularity.desc",
//       page,
//     },
//   });

//   // Filter by language and format
//   const formatted = (res.data.results || []).map((movie: any) => ({
//     id: movie.id,
//     title: movie.title,
//     overview: movie.overview,
//     genres: movie.genre_ids.map((id: number) => genreMap[id] || "Unknown"),
//     rating: movie.vote_average, // out of 10
//     posterUrl: movie?.poster_path ? posterBase + movie?.poster_path : null,
//     releaseDate: movie.release_date,
//     runtime: movie.runtime,
//     voteCount: movie.vote_count,
//   }));

//   return formatted;
// }

const CACHE_EXPIRY = Number(process.env.REDIS_EXPIRY_SECONDS); // 7 days

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const searchQuery = url.searchParams.get("query")?.trim() || "";
    const genres = url.searchParams.get("with_genres") || "";
    const languages = url.searchParams.get("with_original_language") || "";
    const dateFrom = url.searchParams.get("primary_release_date.gte") || "";
    const dateTo = url.searchParams.get("primary_release_date.lte") || "";

    const isFiltered = searchQuery || genres || languages || dateFrom || dateTo;

    let cacheKey = `movies:nowPlaying:IN:page:${page}`;

    if (!isFiltered) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return NextResponse.json({
          source: "cache",
          page,
          total: parsed.length,
          data: parsed,
          message: "Movies fetched from cache",
        });
      }
    }

    const today = new Date().toISOString().split("T")[0];
    const past = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) // last 30 days
      .toISOString()
      .split("T")[0];

    console.log("today >>>", today);
    console.log("past >>>", past);

    // build params for TMDB
    const params: any = {
      region: "IN",
      with_release_type: "2|3",
      sort_by: "popularity.desc",
      page,
      "release_date.gte": past,
      "release_date.lte": today,
    };

    if (searchQuery) params.query = searchQuery;
    if (genres) params.with_genres = genres;
    if (languages) params.with_original_language = languages;
    if (dateFrom) params["primary_release_date.gte"] = dateFrom;
    if (dateTo) params["primary_release_date.lte"] = dateTo;

    const res = searchQuery
      ? await tmdb.get("/search/movie", { params })
      : await tmdb.get("/discover/movie", { params });

    const formatted = (res.data.results || []).map((movie: any) => ({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      genres: movie.genre_ids.map((id: number) => genreMap[id] || "Unknown"),
      rating: movie.vote_average,
      posterUrl: movie?.poster_path ? posterBase + movie?.poster_path : null,
      releaseDate: movie.release_date,
      runtime: movie.runtime,
      voteCount: movie.vote_count,
      original_language: movie?.original_language,
    }));

    // cache only unfiltered requests
    if (!isFiltered) {
      await redis.set(cacheKey, JSON.stringify(formatted), "EX", CACHE_EXPIRY);
    }

    return NextResponse.json({
      source: "tmdb",
      page,
      total: formatted.length,
      data: formatted,
      message: "Movies fetched successfully",
    });
  } catch (err: any) {
    console.error("movies route error:", err);
    return NextResponse.json(
      { error: "Failed to fetch movies" },
      { status: 500 }
    );
  }
}
