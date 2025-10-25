import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";
import { tmdb } from "@/lib/tmdb";
import {
  CastMember,
  CrewMember,
  MovieData,
  MovieDetails,
  Review,
  Video,
} from "@/lib/types/movie";

const CACHE_EXPIRY = Number(process.env.REDIS_EXPIRY_SECONDS); // 7 days

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: movieId } = await params;
    console.log(`Fetching movie ${movieId}`);

    // Validate movie ID
    if (!movieId || isNaN(Number(movieId))) {
      return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
    }

    // Check cache first
    const cacheKey = `movie:${movieId}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      console.log(`Cache hit for movie ${movieId}`);
      return NextResponse.json(
        {
          data: parsed,
          cached: true,
        },
        {
          status: 200,
        }
      );
    }

    console.log(`Cache miss for movie ${movieId}, fetching from TMDB`);

    // Fetch all data in parallel
    // const [detailsRes, creditsRes, reviewsRes, videosRes, releaseDatesRes] =
    //   await Promise.all([
    //     tmdb.get(`/movie/${movieId}`),
    //     tmdb.get(`/movie/${movieId}/credits`),
    //     tmdb.get(`/movie/${movieId}/reviews`, { params: { page: 1 } }),
    //     tmdb.get(`/movie/${movieId}/videos`),
    //     tmdb.get(`/movie/${movieId}/release_dates`),
    //   ]);

    // // Check if all requests were successful
    // if (!detailsRes) {
    //   console.log("Movie not found");
    //   return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    // }
    const results = await Promise.allSettled([
      tmdb.get(`/movie/${movieId}`),
      tmdb.get(`/movie/${movieId}/credits`),
      tmdb.get(`/movie/${movieId}/reviews`, { params: { page: 1 } }),
      tmdb.get(`/movie/${movieId}/videos`),
      tmdb.get(`/movie/${movieId}/release_dates`),
    ]);

    const [detailsRes, creditsRes, reviewsRes, videosRes, releaseDatesRes] =
      results.map((r) => (r.status === "fulfilled" ? r.value : null));

    // ✅ Now safely check if movie details were retrieved
    if (!detailsRes) {
      console.warn(`Movie ${movieId} not found on TMDB`);
      return NextResponse.json(
        { success: false, error: "Movie not found" },
        { status: 404 }
      );
    }

    // Parse responses
    const details: MovieDetails = detailsRes?.data;
    const creditsData = creditsRes?.data;
    const reviewsData = reviewsRes?.data;
    const videosData = videosRes?.data;
    const releaseDatesData = releaseDatesRes?.data;

    // Extract cast and crew
    const cast: CastMember[] = creditsData.cast || [];
    const crew: CrewMember[] = creditsData.crew || [];

    // Extract reviews
    const reviews: Review[] = reviewsData.results || [];

    // Extract videos (only YouTube)
    const videos: Video[] = (videosData.results || []).filter(
      (video: Video) => video.site === "YouTube"
    );

    // Extract India certification
    let certification: string | null = null;
    const indiaRelease = releaseDatesData.results?.find(
      (r: any) => r.iso_3166_1 === "IN"
    );
    if (indiaRelease && indiaRelease.release_dates?.length > 0) {
      certification = indiaRelease.release_dates[0].certification || null;
    }

    const movieDetails = {
      ...details,
      certification,
    };

    // Prepare response data
    const movieData: MovieData = {
      movieDetails,
      cast,
      crew,
      reviews,
      videos,
    };

    // Cache the data for 7 days
    await redis.set(cacheKey, JSON.stringify(movieData), "EX", CACHE_EXPIRY);

    return NextResponse.json(
      {
        data: movieData,
        cached: false,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error fetching movie data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
