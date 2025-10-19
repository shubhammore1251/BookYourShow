"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Calendar,
  Film,
  Globe,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import api from "@/lib/axios";
import { Movie, MovieData } from "@/lib/types/movie";
import MovieCard from "@/components/MOvieCard";
import toast from "react-hot-toast";
import { set } from "zod";

const MoviesListingPage = () => {
  const [movies, setMovies] = useState<Movie[] | []>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters
  const [filters, setFilters] = useState<any>({
    selectedGenres: [],
    selectedLanguages: [],
    dateRange: { from: "", to: "" },
    searchQuery: "",
  });

  const [applyFilters, setApplyFilters] = useState<boolean>(false);

  const [hasMore, setHasMore] = useState<boolean>(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const IMAGE_BASE = "https://image.tmdb.org/t/p/orginal";

  // Genre list from TMDB
  const genres = [
    { id: 28, name: "Action" },
    { id: 12, name: "Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 14, name: "Fantasy" },
    { id: 36, name: "History" },
    { id: 27, name: "Horror" },
    { id: 10402, name: "Music" },
    { id: 9648, name: "Mystery" },
    { id: 10749, name: "Romance" },
    { id: 878, name: "Science Fiction" },
    { id: 10770, name: "TV Movie" },
    { id: 53, name: "Thriller" },
    { id: 10752, name: "War" },
    { id: 37, name: "Western" },
  ];

  // Indian languages with TMDB language codes
  const indianLanguages = [
    { code: "hi", name: "Hindi" },
    { code: "en", name: "English" },
    { code: "kn", name: "Kannada" },
    { code: "ml", name: "Malayalam" },
    { code: "mr", name: "Marathi" },
    { code: "ta", name: "Tamil" },
    { code: "te", name: "Telugu" },
    { code: "pa", name: "Punjabi" },
    { code: "bn", name: "Bengali" },
  ];

  const fetchMovies = useCallback(async () => {
    if (!applyFilters) {
      try {
        let url = "";

        //   Search query takes priority
        if (searchQuery.trim()) {
          url = `/api/movies?query=${encodeURIComponent(
            searchQuery
          )}&page=${currentPage}`;
        } else {
          // Discover movies with filters
          url = `/api/movies?page=${currentPage}&sort_by=popularity.desc&region=IN`;

          // Add genre filter
          if (filters.selectedGenres.length > 0) {
            url += `&with_genres=${filters.selectedGenres.join(",")}`;
          }

          // Add language filter
          if (filters.selectedLanguages.length > 0) {
            url += `&with_original_language=${filters.selectedLanguages.join(
              "|"
            )}`;
          }

          // Add date range filter
          if (filters.dateRange.from) {
            url += `&primary_release_date.gte=${filters.dateRange.from}`;
          }
          if (filters.dateRange.to) {
            url += `&primary_release_date.lte=${filters.dateRange.to}`;
          }
        }

        const res = await api.get(url);
        const newMovies: Movie[] = res.data.data || [];

        setMovies((prev) => [...prev, ...newMovies]);
        setHasMore(newMovies.length > 0);
      } catch (error) {
        console.log("Error fetching movies:", error);
        toast.error("Something went wrong");
      } finally {
        if (currentPage === 1) {
          setLoading(false);
        }
        setApplyFilters(false);
      }
    }
  }, [currentPage, applyFilters]);

  console.log("applyFilters >>>", applyFilters);

  const handleApplyFilters = async () => {
    setCurrentPage(1);
    setMovies([]);
    setLoading(true);
    setApplyFilters(true);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setApplyFilters(true);
    setFilters({
      selectedGenres: [],
      selectedLanguages: [],
      dateRange: { from: "", to: "" },
      searchQuery: "",
    });
  };

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [loading, hasMore]);

  const toggleGenre = (genreId: any) => {
    setFilters((prev: any) => ({
      ...prev,
      selectedGenres: prev.selectedGenres.includes(genreId)
        ? prev.selectedGenres.filter((id: any) => id !== genreId)
        : [...prev.selectedGenres, genreId],
    }));

    setCurrentPage(1);
  };

  const toggleLanguage = (languageCode: any) => {
    setFilters((prev: any) => ({
      ...prev,
      selectedLanguages: prev.selectedLanguages.includes(languageCode)
        ? prev.selectedLanguages.filter((code: any) => code !== languageCode)
        : [...prev.selectedLanguages, languageCode],
    }));
    setCurrentPage(1);
  };

  const handleSearchKeyPress = (e: any) => {
    if (e.key === "Enter") {
      setCurrentPage(1);
      fetchMovies();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold mb-4">Movies</h1>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-12 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar - Filters */}
          <div className="w-64 flex-shrink-0 space-y-6">
            {/* Clear Filters */}
            {(filters.selectedGenres.length > 0 ||
              filters.selectedLanguages.length > 0 ||
              filters.dateRange.from ||
              filters.dateRange.to) && (
              <button
                onClick={clearFilters}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg font-semibold transition"
              >
                Clear All Filters
              </button>
            )}

            {/* Date Range Filter */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-pink-500" />
                <h3 className="font-semibold">Release Date</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    From
                  </label>
                  <input
                    type="date"
                    value={filters.dateRange.from}
                    onChange={(e) => {
                      setFilters((prev: any) => ({
                        ...prev,
                        dateRange: {
                          ...prev.dateRange,
                          from: e.target.value,
                        },
                      }));
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">To</label>
                  <input
                    type="date"
                    value={filters.dateRange.to}
                    onChange={(e) => {
                      setFilters((prev: any) => ({
                        ...prev,
                        dateRange: {
                          ...prev.dateRange,
                          to: e.target.value,
                        },
                      }));
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>
            </div>

            {/* Genre Filter */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Film className="w-5 h-5 text-pink-500" />
                <h3 className="font-semibold">Genres</h3>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {genres.map((genre) => (
                  <label
                    key={genre.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 p-2 rounded transition"
                  >
                    <input
                      type="checkbox"
                      checked={filters.selectedGenres.includes(genre?.id)}
                      onChange={() => toggleGenre(genre.id)}
                      className="w-4 h-4 rounded border-gray-600 text-pink-500 focus:ring-pink-500 focus:ring-offset-0"
                    />
                    <span className="text-sm">{genre.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Language Filter */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5 text-pink-500" />
                <h3 className="font-semibold">Language</h3>
              </div>
              <div className="space-y-2">
                {indianLanguages.map((language) => (
                  <label
                    key={language.code}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 p-2 rounded transition"
                  >
                    <input
                      type="checkbox"
                      checked={filters.selectedLanguages.includes(
                        language.code
                      )}
                      onChange={() => toggleLanguage(language.code)}
                      className="w-4 h-4 rounded border-gray-600 text-pink-500 focus:ring-pink-500 focus:ring-offset-0"
                    />
                    <span className="text-sm">{language.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {(filters.selectedGenres.length > 0 ||
              filters.selectedLanguages.length > 0 ||
              filters.dateRange.from ||
              filters.dateRange.to) && (
              <button
                onClick={handleApplyFilters}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg font-semibold transition"
              >
                Apply Filters
              </button>
            )}
          </div>

          {/* Right Content - Movie Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-xl text-gray-400">Loading movies...</div>
              </div>
            ) : movies.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                <Film className="w-16 h-16 mb-4" />
                <p className="text-xl">No movies found</p>
                <p className="text-sm mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <div
                    className="grid gap-6"
                    style={{
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                    }}
                  >
                    {movies.map((movie, idx) => (
                      <MovieCard key={`movie-${idx}`} movie={movie} />
                    ))}
                  </div>

                  <div
                    ref={loaderRef}
                    className="h-24 flex items-center justify-center"
                  >
                    {loading && (
                      <div className="text-gray-400">
                        Loading more movies...
                      </div>
                    )}
                    {!hasMore && (
                      <div className="text-gray-400">No more movies</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoviesListingPage;
