"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const defaultEvents = [
    {
      id: 1,
      title: "The Grand Circus Spectacular",
      posterUrl: "https://images.unsplash.com/photo-1553481187-be93c21490a9?w=1200&h=600&fit=crop",
      description: "Experience the magic of acrobats, clowns, and breathtaking performances"
    },
    {
      id: 2,
      title: "Summer Music Carnival 2025",
      posterUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&h=600&fit=crop",
      description: "Three days of live music, food trucks, and entertainment"
    },
    {
      id: 3,
      title: "National Basketball Championship",
      posterUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&h=600&fit=crop",
      description: "Watch the best teams compete for the ultimate trophy"
    },
    {
      id: 4,
      title: "Winter Wonderland Fair",
      posterUrl: "https://images.unsplash.com/photo-1569043024177-638b4e762e6c?w=1200&h=600&fit=crop",
      description: "Ice skating, winter rides, and festive celebrations"
    },
    {
      id: 5,
      title: "International Soccer Tournament",
      posterUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=600&fit=crop",
      description: "Elite teams from around the world battle it out"
    }
  ];

export default function CustomCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Sample data if none provided
  const slides = defaultEvents;

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  const goToSlide = (index:number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  if (!slides || slides.length === 0) return null;

  return (
    <div className="relative w-full mx-auto px-0 py-1">
      {/* Main Carousel Container */}
      <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden bg-gray-800">
        {/* Slides */}
        <div
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((movie) => (
            <div
              key={movie.id}
              className="min-w-full h-full relative"
            >
              <div
                className="w-full h-full bg-cover bg-center relative flex items-end p-6"
                style={{
                  backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.1)), url(${movie.posterUrl})`,
                }}
              >
                <div className="text-white z-10">
                  <h2 className="text-2xl md:text-4xl font-bold drop-shadow-lg">
                    {movie.title}
                  </h2>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all duration-200 z-20"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all duration-200 z-20"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Pagination Bullets */}
      <div className="flex justify-center gap-2 mt-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-8 bg-blue-500"
                : "w-2 bg-gray-400 hover:bg-gray-300"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}