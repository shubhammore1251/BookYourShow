"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, MapPin, Search, X, Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { formatRuntime } from "./MovieDetailsPage";
// Dummy data
const LOCATIONS = {
  Mumbai: ["Kalyan", "Thane", "Navi Mumbai", "Andheri", "Bandra"],
  // Delhi: ["Connaught Place", "Saket", "Rohini", "Dwarka", "Noida"],
  Pune: ["Koregaon Park", "Hinjewadi", "Kothrud"],
  Hyderabad: ["Banjara Hills", "Secunderabad", "Kukatpally"],
  // Bengaluru: ["Koramangala", "Whitefield", "Indiranagar", "JP Nagar"],
  // Chennai: ["T Nagar", "Anna Nagar", "Velachery", "OMR"],
  // Kolkata: ["Park Street", "Salt Lake", "Rajarhat", "Ballygunge"],
};

const getWeeklyDates = () => {
  const result = [];
  const today = new Date();

  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const monthNames = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  for (let i = 0; i < 7; i++) {
    const dateObj = new Date();
    dateObj.setDate(today.getDate() + i);

    result.push({
      day: dayNames[dateObj.getDay()],
      date: dateObj.getDate(),
      month: monthNames[dateObj.getMonth()],
      label: i === 0 ? "Today" : null,
      blocked: i >= 4, // last 3 days blocked
      fullDate: `${dateObj.getFullYear()}-${String(
        dateObj.getMonth() + 1
      ).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`,
    });
  }

  return result;
};

const DATES = getWeeklyDates();

const SCREEN_TYPES = [
  "Hindi-2D",
  "Hindi-IMAX 2D",
  "Hindi-IMAX 3D",
  "Hindi-4DX",
  "English-2D",
  "English-IMAX 2D",
];

const THEATERS = [
  {
    id: 1,
    name: "INOX: Metro Mall Junction, Kalyan (E)",
    location: "Kalyan",
    hasFood: true,
    hasMTicket: true,
    screenTypes: ["Hindi - 2D", "Hindi - IMAX 2D"],
    showTimes: {
      "Hindi - 2D": [
        { time: "02:15 PM", status: "available", filling: "filling" },
        { time: "03:15 PM", status: "available" },
        { time: "04:15 PM", status: "available" },
        { time: "05:45 PM", status: "available", filling: "fast" },
        { time: "06:45 PM", status: "available" },
        { time: "07:45 PM", status: "available", filling: "filling" },
        { time: "09:15 PM", status: "available" },
      ],
      "Hindi - IMAX 2D": [
        { time: "10:15 PM", status: "available", cancellable: true },
        {
          time: "10:45 PM",
          status: "available",
          label: "KUTUB MUGHHA",
          cancellable: true,
        },
        { time: "11:15 PM", status: "available", cancellable: true },
      ],
    },
  },
  {
    id: 2,
    name: "MovieMax: SM5 Kalyan, Renovated",
    location: "Kalyan",
    hasFood: true,
    hasMTicket: true,
    screenTypes: ["Hindi - 2D"],
    showTimes: {
      "Hindi - 2D": [
        {
          time: "02:45 PM",
          status: "available",
          label: "Renovated",
          cancellable: true,
        },
        {
          time: "03:30 PM",
          status: "available",
          label: "Renovated",
          cancellable: true,
        },
        {
          time: "04:30 PM",
          status: "available",
          label: "Renovated",
          cancellable: true,
        },
        { time: "06:15 PM", status: "available", cancellable: true },
        {
          time: "07:00 PM",
          status: "available",
          label: "Renovated",
          cancellable: true,
        },
        {
          time: "08:00 PM",
          status: "available",
          label: "Renovated",
          cancellable: true,
        },
        {
          time: "09:45 PM",
          status: "available",
          label: "Renovated",
          cancellable: true,
        },
      ],
    },
  },
  {
    id: 3,
    name: "Mukta A2 Cinemas: Triveni Grande, Kalyan (West)",
    location: "Kalyan",
    hasFood: true,
    hasMTicket: true,
    screenTypes: ["Hindi - 2D", "Hindi - 4DX"],
    showTimes: {
      "Hindi - 2D": [
        {
          time: "03:45 PM",
          status: "available",
          filling: "filling",
          cancellable: true,
        },
        { time: "07:00 PM", status: "available", cancellable: true },
        { time: "09:00 PM", status: "available", cancellable: true },
      ],
      "Hindi - 4DX": [
        {
          time: "10:15 PM",
          status: "available",
          filling: "fast",
          cancellable: true,
        },
      ],
    },
  },
  {
    id: 4,
    name: "PVR: Thane One, Thane (West)",
    location: "Thane",
    hasFood: true,
    hasMTicket: true,
    screenTypes: ["Hindi - IMAX 3D", "English - 2D"],
    showTimes: {
      "Hindi - IMAX 3D": [
        { time: "01:30 PM", status: "available", cancellable: true },
        {
          time: "04:45 PM",
          status: "available",
          filling: "fast",
          cancellable: true,
        },
        { time: "08:00 PM", status: "available", cancellable: true },
      ],
      "English - 2D": [
        { time: "11:00 PM", status: "available", cancellable: true },
      ],
    },
  },
];

const mapApiToFrontend = (apiData: any) => {
  const formatTo12Hour = (time24: string) => {
    if (!time24) return "";
    const [hourStr, minuteStr] = time24.split(":");
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute.toString().padStart(2, "0")} ${ampm}`;
  };

  const theaters = apiData.theaters.map((theater: any) => {
    const screenTypes: string[] = [];
    const showTimes: Record<string, any[]> = {};

    theater.screens.forEach((screen: any) => {
      screen.type.forEach((type: string) => {
        if (!screenTypes.includes(type)) screenTypes.push(type);
        showTimes[type] = showTimes[type] || [];

        // Map each show
        screen.shows.forEach((show: any) => {
          if (show.language && type.includes(show.language)) {
            showTimes[type].push({
              time: formatTo12Hour(show.startTime), // 👈 formatted here
              endTime: formatTo12Hour(show.endTime), // 👈 and here
              price: show.price,
              seatsFilled: show.seatsBooked,
              totalSeats: show.totalSeats,
              availableSeats: show.availableSeats,
              filling:
                show.availableSeats / show.totalSeats < 0.2
                  ? "fast"
                  : show.availableSeats / show.totalSeats < 0.5
                  ? "filling"
                  : undefined,
            });
          }
        });
      });
    });

    const theatreLocation = theater.address.split(",")[0];
    return {
      id: theater.id,
      name: theater.name,
      location: theatreLocation,
      screenTypes,
      showTimes,
    };
  });

  return theaters;
};

export default function MovieTheaterListing({ id }: { id: string }) {
  const [selectedRegion, setSelectedRegion] = useState("Mumbai");
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [theaters, setTheaters] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedDateValue, setSelectedDateValue] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0"); // months 0-11
    const dd = String(today.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
  });
  const [selectedScreenType, setSelectedScreenType] = useState("Hindi-2D");
  const [selectedCity, setSelectedCity] = useState("Kalyan");
  const [movieDetails, setMovieDetails] = useState<any>({});

  useEffect(() => {
    const fetchShows = async () => {
      const response = await axios.get(
        `/api/movies/showtimes?movieId=${id}&date=${selectedDateValue}&location=${selectedCity}&showType=${selectedScreenType}`
      );

      // console.log("response", response);

      setMovieDetails(response?.data?.data?.movie);
      const mappedTheaters = mapApiToFrontend(response?.data?.data);
      // console.log("mappedTheaters", mappedTheaters);
      setTheaters(mappedTheaters);
    };

    fetchShows();
  }, [selectedDate, selectedCity, id, selectedScreenType]);

  console.log("movieDetails", movieDetails);

  // Then use `theaters` instead of static THEATERS
  const filteredTheaters = theaters.filter((theater) =>
    theater.screenTypes.includes(selectedScreenType)
  );

  const filteredLocations = Object.entries(LOCATIONS).filter(([region]) =>
    region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-background border-b border-muted-foreground sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">
                {movieDetails?.title} - ({selectedScreenType?.split("-")[0]})
              </h1>
              <Button
                variant="outline"
                className="gap-2 border-muted-foreground cursor-pointer"
                onClick={() => setIsLocationModalOpen(true)}
              >
                <MapPin className="w-4 h-4" />
                {selectedCity}, {selectedRegion}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2 text-sm text-gray-600">
              <span className="px-2 py-1 bg-gray-100 rounded">
                Movie runtime: {formatRuntime(movieDetails?.runtime)}
              </span>
              <span className="px-2 py-1 bg-gray-100 rounded">
                {movieDetails?.certification}
              </span>
              {movieDetails?.genres?.map((genre: any, idx: any) => (
                <span className="px-2 py-1 bg-gray-100 rounded">
                  {genre.name}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* Date Selection */}
        <div className="bg-background border-b border-muted-foreground sticky top-[120px] z-30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-4 overflow-x-auto py-4">
              {DATES.map((date, index) => (
                <button
                  key={index}
                  disabled={date.blocked}
                  onClick={() => {
                    setSelectedDate(index);

                    setSelectedDateValue(date.fullDate);
                  }}
                  className={`flex flex-col items-center min-w-[80px] px-4 py-2 rounded-lg transition-colors ${
                    selectedDate === index
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  } ${
                    date.blocked
                      ? "opacity-50 cursor-not-allowed"
                      : "opacity-100 cursor-pointer"
                  }`}
                >
                  <span className="text-xs font-semibold">{date.day}</span>
                  <span className="text-2xl font-bold">{date.date}</span>
                  <span className="text-xs">{date.month}</span>
                  {date.label && (
                    <span className="text-xs mt-1">{date.label}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Screen Type Filter */}
        <div className="bg-background border-b border-muted-foreground sticky top-[200px] z-20">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex gap-2 overflow-x-auto">
              {SCREEN_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedScreenType(type)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                    selectedScreenType === type
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Theater Listings */}
        <div className="bg-background max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span>AVAILABLE</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span>FAST FILLING</span>
            </div>
          </div>

          {filteredTheaters.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No theaters found for the selected filters
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTheaters.map((theater: any) => (
                <div
                  key={theater.id}
                  className="rounded-lg shadow-sm border border-muted-foreground p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {theater.name}, {theater.location}
                        </h3>
                        <button className="text-gray-400 hover:text-red-500">
                          <Heart className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        {theater.hasFood && (
                          <span className="text-yellow-500 text-lg">🍿</span>
                        )}
                        {theater.hasMTicket && (
                          <span className="text-green-600 text-xs px-2 py-1 bg-green-50 rounded">
                            M-Ticket
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Show Times */}
                  {theater.screenTypes.map((screenType: any) => {
                    const shows = theater?.showTimes[screenType];
                    if (!shows || screenType !== selectedScreenType)
                      return null;

                    return (
                      <div key={screenType} className="mb-4 last:mb-0">
                        <div className="flex flex-wrap gap-2">
                          {shows.map((show: any, idx: any) => (
                            <button
                              key={idx}
                              className={`cursor-pointer px-4 py-2 rounded border text-sm font-medium transition-all hover:scale-105 ${
                                show.filling === "fast"
                                  ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                                  : show.filling === "filling"
                                  ? "border-yellow-400 bg-yellow-50 text-yellow-600"
                                  : "border-green-500 bg-green-50 text-green-700"
                              }`}
                            >
                              <div>{show.time}</div>
                              {show.label && (
                                <div className="text-xs mt-1 opacity-75">
                                  {show.label}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                        {shows[0]?.cancellable && (
                          <p className="text-xs text-gray-500 mt-2">
                            Cancellation available
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Location Modal */}
        <Dialog
          open={isLocationModalOpen}
          onOpenChange={setIsLocationModalOpen}
        >
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto custom-scroll">
            <DialogHeader>
              <DialogTitle>Select Your Location</DialogTitle>
            </DialogHeader>

            <div className="mt-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search for your city"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button
                onClick={() => {
                  // Auto-detect logic would go here
                  alert("Auto-detect location");
                }}
                className="flex items-center gap-2 text-red-500 font-medium mb-6 hover:text-red-600"
              >
                <MapPin className="w-5 h-5" />
                Detect my location
              </button>

              <h3 className="text-lg font-semibold mb-4">Popular Cities</h3>

              <div className="space-y-6">
                {filteredLocations.map(([region, cities]) => (
                  <div key={region}>
                    <h4 className="font-semibold text-gray-700 mb-3">
                      {region}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {cities.map((city) => (
                        <button
                          key={city}
                          onClick={() => {
                            setSelectedRegion(region);
                            setSelectedCity(city);
                            setIsLocationModalOpen(false);
                          }}
                          className={`cursor-pointer px-4 py-2 rounded-lg text-left transition-colors ${
                            selectedRegion === region && selectedCity === city
                              ? "bg-red-500 text-white"
                              : "bg-gray-100 text-muted hover:bg-gray-200"
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
