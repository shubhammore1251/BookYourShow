"use client";
import Carousel from "@/components/Carousel";
import MovieCard from "@/components/MOvieCard";
import api from "@/lib/axios";
import React, { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, Autoplay } from "swiper/modules"; // ✅ Correct import "swiper/css"; import "swiper/css/pagination"; import "swiper/css/navigation"; import "swiper/css/lazy";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Movie, MovieData } from "@/lib/types/movie";
import { useRouter } from "next/navigation";

const ExploreMovies = () => {
  // const [city, setCity] = useState<string>("mumbai");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  
  const router = useRouter();

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/movies`);
        setMovies(res.data.data || []);
      } catch (err) {
        console.error("fetch movies error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  const checkScrollPosition = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollPosition();
    const scrollContainer: any = scrollRef.current;
    if (scrollContainer) {
      scrollContainer?.addEventListener("scroll", checkScrollPosition);
      window.addEventListener("resize", checkScrollPosition);
      return () => {
        scrollContainer?.removeEventListener("scroll", checkScrollPosition);
        window.removeEventListener("resize", checkScrollPosition);
      };
    }
  }, [movies]);

  const handleMouseDown = (e: any) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    scrollRef.current.style.scrollBehavior = "auto";
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollRef.current) {
      scrollRef.current.style.scrollBehavior = "smooth";
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Touch handlers
  const handleTouchStart = (e: any) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    scrollRef.current.style.scrollBehavior = "auto";
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleTouchMove = (e: any) => {
    if (!isDragging || !scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (scrollRef.current) {
      scrollRef.current.style.scrollBehavior = "smooth";
    }
  };

  // Arrow navigation
  const scroll = (direction: any) => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  console.log("movies >>> ", movies);
  return (
    <div className="w-full mx-auto px-4 py-6">
      {/* <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Explore Movies</h1>
        <RegionDropdown value={city} onChange={setCity} />
      </div> */}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <Carousel />
          <section className="mt-8 relative">
            {/* Header with Title and See All Button */}
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xl font-semibold">Recommended Movies</h2>
              <button
                onClick={() => {
                  // Add your navigation logic here
                  router.push("/explore-movies/now-playing");
                }}
                className="cursor-pointer flex items-center gap-1 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors group"
              >
                See All
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Carousel Container */}
            <div className="relative group">
              {/* Left Arrow */}
              {showLeftArrow && (
                <button
                  onClick={() => scroll("left")}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </button>
              )}

              {/* Scrollable Container */}
              <div
                ref={scrollRef}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`flex gap-4 overflow-x-auto pb-6 px-2 scrollbar-hide ${
                  isDragging ? "cursor-grabbing select-none" : "cursor-grab"
                }`}
                style={{
                  scrollBehavior: "smooth",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {movies.map((m) => (
                  <MovieCard key={m.id} movie={m} />
                ))}
              </div>

              {/* Right Arrow */}
              {showRightArrow && (
                <button
                  onClick={() => scroll("right")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </button>
              )}

              {/* Left Gradient Overlay */}
              {showLeftArrow && (
                <div className="absolute left-0 top-0 bottom-6 w-12 bg-gradient-to-r from-white/80 to-transparent pointer-events-none z-[5]" />
              )}

              {/* Right Gradient Overlay */}
              {showRightArrow && (
                <div className="absolute right-0 top-0 bottom-6 w-12 bg-gradient-to-l from-white/80 to-transparent pointer-events-none z-[5]" />
              )}
            </div>

            <style jsx>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
          </section>
        </>
      )}
    </div>
  );
};

export default ExploreMovies;
