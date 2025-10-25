"use client";
import React, { useState, useEffect } from "react";
import {
  Star,
  Play,
  Calendar,
  Clock,
  Globe,
  ChevronLeft,
  ChevronRight,
  Share2,
  ThumbsUp,
  Router,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { Credits, Review, Video } from "@/lib/types/movie";
import ShareSocialModal from "@/components/modals/ShareSocialModal";

const ImageBaseURL = "https://image.tmdb.org/t/p";

let fallbackImage =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpT3NuL8oMTj760VFk9yKuyn0xsPApH-rFpRAlw4Qqotev1t7Z1JR-RDCtaTpREgRmNsM";

export const formatRuntime = (minutes: any) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
};

const MovieDetailsPage = ({ id }: { id: string }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [movie, setMovie] = useState<any>(null);
  const releaseFormats = "3D, 4DX, IMAX 2D, IMAX 3D, 2D";
  const [credits, setCredits] = useState<Credits | null>(null);
  const [reviews, setReviews] = useState<Review[] | []>([]);
  const [videos, setVideos] = useState<Video[] | []>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // const [castScroll, setCastScroll] = useState<any>(0);
  // const [crewScroll, setCrewScroll] = useState<any>(0);

  const [showTrailerModal, setShowTrailerModal] = useState<boolean>(false);
  const [selectedTrailer, setSelectedTrailer] = useState<any>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Add this function to get the official trailer
  const getOfficialTrailer = () => {
    if (!videos || videos.length === 0) return null;

    // Try to find official trailer first
    const officialTrailer = videos.find(
      (video: any) => video.type === "Trailer" && video.official === true
    );

    // If no official trailer, get first trailer
    const anyTrailer = videos.find((video: any) => video.type === "Trailer");

    return officialTrailer || anyTrailer || videos[0];
  };

  useEffect(() => {
    if (!id) {
      router.push("/explore-movies");
      toast.error("Invalid movie ID");
    }
    fetchMovieData();
  }, []);

  const fetchMovieData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`api/movies/${id}`);
      console.log(res);
      if (res.status === 200 && res.data) {
        setMovie(res.data.data.movieDetails);
        setCredits({
          cast: res.data.data.cast,
          crew: res.data.data.crew,
        });
        setReviews(res.data.data.reviews);
        setVideos(res.data.data.videos);
      }
    } catch (error) {
      console.error("Error fetching movie data:", error);
      toast.error("Something went wrong");
      router.push("/explore-movies");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  console.log("credits", credits);

  const formatDate = (dateString: any) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getTimeAgo = (dateString: any) => {
    const date = new Date(dateString);
    const now = new Date();
    const days = Math.floor(
      (Number(now) - Number(date)) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return "Today";
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  };

  const scrollCast = (direction: any) => {
    const container = document.getElementById("cast-container");
    const scrollAmount = 300;
    if (container) {
      container.scrollBy({
        left: direction * scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const scrollCrew = (direction: any) => {
    const container = document.getElementById("crew-container");
    const scrollAmount = 300;
    if (container) {
      container.scrollBy({
        left: direction * scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Banner Section - Exact Match */}
      <div className="relative bg-black">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url(${ImageBaseURL}/original${
              movie?.backdrop_path || ""
            })`,
            backgroundColor: "#0a0a0a",
          }}
        ></div>

        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-transparent"></div>

        <div className="relative z-10 container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Left - Poster */}
            <div className="flex-shrink-0">
              <img
                src={
                  movie?.poster_path
                    ? `${ImageBaseURL}/w300_and_h450_bestv2/${movie.poster_path}`
                    : fallbackImage
                }
                alt={movie?.title}
                className="w-56 rounded-lg shadow-2xl"
              />
              <div className="mt-3 text-center text-xs text-gray-400">
                {movie?.status === "Released" &&
                new Date(movie?.release_date) <= new Date()
                  ? "In Cinemas"
                  : "Upcoming"}
              </div>
            </div>

            {/* Right - Details */}
            <div className="flex-1 space-y-5 pt-4">
              <h1 className="text-4xl md:text-5xl font-bold">{movie?.title}</h1>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded">
                  <Star className="w-5 h-5 text-red-500 fill-red-500" />
                  <span className="font-bold text-lg">
                    {movie?.vote_average?.toFixed(1)}/10
                  </span>
                  {/* <span className="text-gray-400 text-sm">
                    ({(movie?.vote_count / 1000).toFixed(0)}K Votes)
                  </span> */}
                </div>
                {/* <button className="cursor-pointer bg-white text-black px-4 py-1.5 rounded text-sm font-semibold hover:bg-gray-200 transition">
                  Rate now
                </button> */}
                <button
                  className="cursor-pointer p-2 hover:bg-white/10 rounded transition"
                  onClick={() => setShowShareModal(true)}
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Formats */}
              <div className="bg-gray-900 px-4 py-2 rounded inline-block">
                <span className="text-sm">{releaseFormats}</span>
              </div>

              {/* Languages and Genres */}
              <div className="bg-gray-900 px-4 py-2 rounded inline-block ml-3">
                <span className="text-sm">
                  Original Language: {movie?.spoken_languages[0]?.english_name}
                </span>
              </div>

              {/* Duration and Details */}
              <div className="flex items-center gap-4 text-sm">
                <span>{formatRuntime(movie?.runtime)}</span>
                <span>•</span>
                {movie?.genres?.map((genre: any, idx: any) => (
                  <span key={genre.name}>
                    {genre.name}
                    {idx < movie.genres.length - 1 ? ", " : ""}
                  </span>
                ))}
                <span>•</span>
                <span>{movie?.certification}</span>
                <span>•</span>
                <span>{formatDate(movie?.release_date)}</span>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    router.push(`${pathname}/book-ticket`);
                  }}
                  className="bg-primary hover:opacity-50 text-white font-semibold px-8 py-3 rounded-lg transition text-lg cursor-pointer"
                >
                  Book tickets
                </button>

                {/* Play Trailer Button - Only show if videos exist */}
                {videos && videos.length > 0 && (
                  <button
                    onClick={() => {
                      const trailer = getOfficialTrailer();
                      if (trailer) {
                        setSelectedTrailer(trailer);
                        setShowTrailerModal(true);
                      }
                    }}
                    className="cursor-pointer flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-lg transition border border-white/20"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    Play Trailer
                  </button>
                )}
              </div>

              {/* About */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xl font-semibold">About the movie</h3>
                <p className="text-gray-300 leading-relaxed max-w-3xl">
                  {movie?.overview}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cast Carousel */}
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Cast</h2>
          <div className="flex gap-2">
            <button
              onClick={() => scrollCast(-1)}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => scrollCast(1)}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div
          id="cast-container"
          className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {credits?.cast.map((person: any, idx: any) => (
            <div key={`cast-${idx}`} className="flex-shrink-0 text-center w-32">
              <div className="w-32 h-32 rounded-full bg-gray-800 mb-3 overflow-hidden">
                {person.profile_path ? (
                  <img
                    src={`${ImageBaseURL}/w185${person.profile_path}`}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl font-bold">
                    {person.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="font-semibold text-sm">{person.name}</div>
              <div className="text-gray-400 text-xs mt-1">
                {person.character}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Crew Carousel */}
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Crew</h2>
          <div className="flex gap-2">
            <button
              onClick={() => scrollCrew(-1)}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => scrollCrew(1)}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div
          id="crew-container"
          className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {credits?.crew.map((person: any, idx: any) => (
            <div key={`crew-${idx}`} className="flex-shrink-0 text-center w-32">
              <div className="w-32 h-32 rounded-full bg-gray-800 mb-3 overflow-hidden">
                {person.profile_path ? (
                  <img
                    src={`${ImageBaseURL}/w185${person.profile_path}`}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl font-bold">
                    {person.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="font-semibold text-sm">{person.name}</div>
              <div className="text-gray-400 text-xs mt-1">{person.job}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Modern Reviews Section */}
      {reviews.length > 0 && (
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Top reviews</h2>
            <a
              href="#"
              className="text-accent hover:text-accent font-semibold flex items-center gap-2"
            >
              250.4K reviews
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>

          <div className="mb-6 flex gap-3 flex-wrap">
            <button className="px-4 py-2 bg-accent text-white rounded-full text-sm font-semibold">
              #SuperDirection <span className="ml-1">184K18</span>
            </button>
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-sm font-semibold transition">
              #GreatActing <span className="ml-1 text-gray-400">197220</span>
            </button>
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-sm font-semibold transition">
              #Blockbuster <span className="ml-1 text-gray-400">151386</span>
            </button>
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-sm font-semibold transition">
              #AwesomeStory <span className="ml-1 text-gray-400">130614</span>
            </button>
          </div>

          <div className="text-sm text-gray-400 mb-6">
            Summary of 250.4K reviews
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {reviews.map((review: any) => (
              <div
                key={review.id}
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-800 hover:border-accent/30 transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-xl font-bold flex-shrink-0">
                    {review.author.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-lg">
                        {review.author}
                      </div>
                      {review.author_details?.rating && (
                        <div className="flex items-center gap-1 bg-accent/20 px-3 py-1 rounded-full">
                          <Star className="w-4 h-4 text-primary fill-accent" />
                          <span className="text-primary font-bold">
                            {review.author_details.rating}/10
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-gray-400 text-sm">
                      Booked on BookMyShow
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex gap-2 flex-wrap mb-3">
                    {review.content
                      .match(/#\w+/g)
                      ?.slice(0, 4)
                      .map((tag: any, idx: any) => (
                        <span
                          key={idx}
                          className="text-pink-500 text-sm font-semibold"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                  <p className="text-gray-300 leading-relaxed line-clamp-3">
                    {review.content.replace(/#\w+/g, "").trim()}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <ThumbsUp className="w-4 h-4" />
                    <span>{review.likes?.toLocaleString()}</span>
                  </div>
                  <div className="text-gray-400 text-sm">
                    {getTimeAgo(review.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* YouTube Trailer Modal */}
      {showTrailerModal && selectedTrailer && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowTrailerModal(false)}
        >
          <div
            className="relative w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowTrailerModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-red-500 transition flex items-center gap-2 text-lg font-semibold"
            >
              <X className="w-6 h-6" />
              Close
            </button>

            {/* Trailer Title */}
            <div className="mb-4 text-white">
              <h3 className="text-xl font-bold">{selectedTrailer.name}</h3>
              <p className="text-sm text-gray-400">
                {selectedTrailer.type} •{" "}
                {selectedTrailer.official ? "Official" : "Fan Made"}
              </p>
            </div>

            {/* YouTube Player */}
            <div className="relative pt-[56.25%] bg-black rounded-lg overflow-hidden shadow-2xl">
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${selectedTrailer.key}?autoplay=1&rel=0`}
                title={selectedTrailer.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareSocialModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          shareUrl={`${process.env.NEXT_PUBLIC_BASE_URL}${pathname}`}
          title={movie?.title || "Check out this movie!"}
          description={movie?.overview?.substring(0, 100) ?? ""}
        />
      )}
    </div>
  );
};

export default MovieDetailsPage;
