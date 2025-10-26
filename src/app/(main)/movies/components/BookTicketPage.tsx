"use client";

import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, MapPin, Calendar, Users, IndianRupee } from 'lucide-react';

// Types
interface Seat {
  id: string;
  row: string;
  number: number;
  type: string;
  status: 'available' | 'sold' | 'locked';
}

interface SeatRow {
  row: string;
  type: string;
  seats: Seat[];
}

interface PriceCategory {
  type: string;
  price: number;
  color: string;
}

interface TimeSlot {
  time: string;
  showId: number;
  available: boolean;
}

interface Show {
  id: number;
  movieId: number;
  movieName: string;
  language: string;
  date: string;
  startTime: string;
  screenName: string;
  theaterName: string;
  location: string;
  totalSeats: number;
  seatsFilled: number;
}

interface ShowData {
  show: Show;
  priceCategories: PriceCategory[];
  timeSlots: TimeSlot[];
  seats: SeatRow[];
}

// Mock data for demonstration
const mockShowData: ShowData = {
  show: {
    id: 32589,
    movieId: 1196364,
    movieName: "Thamma",
    language: "Hindi",
    date: "2025-10-26",
    startTime: "10:55 PM",
    screenName: "Screen 1",
    theaterName: "INOX: Metro Mall Junction",
    location: "Kalyan (E)",
    totalSeats: 200,
    seatsFilled: 45
  },
  priceCategories: [
    { type: "GOLD", price: 490, color: "bg-yellow-100 border-yellow-300 text-yellow-700" },
    { type: "SILVER", price: 330, color: "bg-gray-100 border-gray-300 text-gray-700" },
    { type: "PREMIER", price: 310, color: "bg-blue-100 border-blue-300 text-blue-700" },
    { type: "EXECUTIVE", price: 290, color: "bg-purple-100 border-purple-300 text-purple-700" }
  ],
  timeSlots: [
    { time: "10:55 PM", showId: 32589, available: true },
    { time: "11:30 PM", showId: 32590, available: false }
  ],
  seats: generateSeats()
};

function generateSeats(): SeatRow[] {
  const sections = [
    { name: "A", type: "GOLD", rows: 1, seatsPerRow: 16, startRow: 0 },
    { name: "B", type: "SILVER", rows: 6, seatsPerRow: 20, startRow: 1 },
    { name: "J", type: "PREMIER", rows: 5, seatsPerRow: 20, startRow: 7 },
    { name: "O", type: "EXECUTIVE", rows: 2, seatsPerRow: 20, startRow: 12 }
  ];

  const occupiedSeats = new Set([
    "B-23", "C-14", "C-18", "D-23", "I-22", "J-23", "K-23", "L-23"
  ]);

  const allSeats: SeatRow[] = [];
  sections.forEach(section => {
    for (let i = 0; i < section.rows; i++) {
      const rowLabel = String.fromCharCode(65 + section.startRow + i);
      const seats: Seat[] = [];
      for (let j = 1; j <= section.seatsPerRow; j++) {
        const seatId = `${rowLabel}-${j}`;
        seats.push({
          id: seatId,
          row: rowLabel,
          number: j,
          type: section.type,
          status: occupiedSeats.has(seatId) ? "sold" : "available"
        });
      }
      allSeats.push({ row: rowLabel, type: section.type, seats });
    }
  });

  return allSeats;
}

interface SeatSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (count: number) => void;
  priceCategories: PriceCategory[];
}

const SeatSelectionModal: React.FC<SeatSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  priceCategories 
}) => {
  const [selectedCount, setSelectedCount] = useState<number>(2);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-center mb-6">How many seats?</h2>
        
        <div className="flex justify-center mb-6">
          <img src="/api/placeholder/120/80" alt="Scooter" className="w-24 h-20" />
        </div>

        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num: number) => (
            <button
              key={num}
              onClick={() => setSelectedCount(num)}
              className={`w-12 h-12 rounded-full font-semibold transition-all ${
                selectedCount === num
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {priceCategories.map((cat: PriceCategory) => (
            <div key={cat.type} className="text-center">
              <div className="text-xs font-semibold text-gray-600 mb-1">{cat.type}</div>
              <div className="flex items-center justify-center text-sm font-bold">
                <IndianRupee size={12} />
                {cat.price}
              </div>
              <div className="text-xs text-green-600 font-medium mt-1">AVAILABLE</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => onConfirm(selectedCount)}
          className="w-full bg-pink-500 text-white py-3 rounded-lg font-semibold hover:bg-pink-600 transition-colors"
        >
          Select Seats
        </button>
      </div>
    </div>
  );
};

const BookTicketPage = ({ movieId, showId, date, region }:any) => {
  const [showModal, setShowModal] = useState<boolean>(true);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [maxSeats, setMaxSeats] = useState<number>(2);
  const [lockedSeats, setLockedSeats] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes

  const { show, priceCategories, timeSlots, seats } = mockShowData;

  useEffect(() => {
    if (!showModal && selectedSeats.length > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev: number) => {
          if (prev <= 1) {
            setSelectedSeats([]);
            return 600;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showModal, selectedSeats]);

  const handleSeatClick = (seat: Seat): void => {
    if (seat.status === "sold" || lockedSeats.has(seat.id)) return;

    const isSelected = selectedSeats.find((s: Seat) => s.id === seat.id);
    if (isSelected) {
      setSelectedSeats(selectedSeats.filter((s: Seat) => s.id !== seat.id));
    } else if (selectedSeats.length < maxSeats) {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const calculateTotal = (): number => {
    return selectedSeats.reduce((total: number, seat: Seat) => {
      const category = priceCategories.find((c: PriceCategory) => c.type === seat.type);
      return total + (category?.price || 0);
    }, 0);
  };

  const getSeatColor = (seat: Seat): string => {
    const isSelected = selectedSeats.find((s: Seat) => s.id === seat.id);
    if (seat.status === "sold") return "bg-gray-400 cursor-not-allowed";
    if (lockedSeats.has(seat.id)) return "bg-orange-300 cursor-not-allowed";
    if (isSelected) return "bg-green-500 text-white";
    return "bg-white border-2 border-green-500 hover:bg-green-100 cursor-pointer";
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const groupedSeats = seats.reduce((acc: Record<string, SeatRow[]>, row: SeatRow) => {
    if (!acc[row.type]) acc[row.type] = [];
    acc[row.type].push(row);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <SeatSelectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={(count: number) => {
          setMaxSeats(count);
          setShowModal(false);
        }}
        priceCategories={priceCategories}
      />

      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{show.movieName} - ({show.language})</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <MapPin size={16} />
                  {show.theaterName}, {show.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={16} />
                  {new Date(show.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={16} />
                  {show.startTime}
                </span>
              </div>
            </div>
            <button className="px-4 py-2 text-pink-500 border border-pink-500 rounded hover:bg-pink-50">
              {maxSeats} Tickets
            </button>
          </div>

          {/* Time Slots */}
          <div className="flex gap-2 mt-4">
            {timeSlots.map((slot: TimeSlot, idx: number) => (
              <button
                key={idx}
                className={`px-4 py-2 rounded ${
                  slot.showId === show.id
                    ? 'bg-green-500 text-white'
                    : slot.available
                    ? 'bg-white border border-gray-300 hover:border-green-500'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!slot.available}
              >
                {slot.time}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timer Warning */}
      {selectedSeats.length > 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-2 text-yellow-800">
            <Clock size={20} />
            <span className="font-semibold">Time remaining: {formatTime(timeLeft)}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Screen */}
        <div className="mb-8">
          <div className="w-full h-2 bg-gradient-to-b from-gray-400 to-gray-200 rounded-t-full mb-2"></div>
          <p className="text-center text-gray-500 text-sm">All eyes this way please!</p>
        </div>

        {/* Seats Layout */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          {Object.entries(groupedSeats).map(([type, rows]: [string, SeatRow[]]) => {
            const category = priceCategories.find((c: PriceCategory) => c.type === type);
            return (
              <div key={type} className="mb-8">
                <div className={`inline-block px-4 py-2 rounded-t-lg font-semibold ${category?.color || ''}`}>
                  ₹{category?.price} {type}
                </div>
                <div className="space-y-2 mt-2">
                  {rows.map((row: SeatRow) => (
                    <div key={row.row} className="flex items-center gap-4">
                      <div className="w-8 text-center font-semibold text-gray-600">
                        {row.row}
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {row.seats.map((seat: Seat) => (
                          <button
                            key={seat.id}
                            onClick={() => handleSeatClick(seat)}
                            className={`w-8 h-8 text-xs font-medium rounded transition-all ${getSeatColor(seat)}`}
                            disabled={seat.status === "sold" || lockedSeats.has(seat.id)}
                          >
                            {seat.number}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-8 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white border-2 border-green-500 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-400 rounded"></div>
            <span>Sold</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      {selectedSeats.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">
                {selectedSeats.length} Seat{selectedSeats.length > 1 ? 's' : ''} Selected
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {selectedSeats.map((s: Seat) => s.id).join(', ')}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Amount</div>
                <div className="text-2xl font-bold flex items-center">
                  <IndianRupee size={20} />
                  {calculateTotal()}
                </div>
              </div>
              <button className="bg-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-pink-600 transition-colors">
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookTicketPage;