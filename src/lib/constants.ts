// Time slots configuration for different theaters
export const THEATER_TIME_SLOTS = {
  default: ['08:00', '12:45', '15:00', '19:30', '22:00'],
  alternate1: ['09:00', '13:00', '16:00', '18:00', '23:00'],
  alternate2: ['08:30', '11:30', '14:30', '17:30', '21:00'],
  alternate3: ['09:30', '12:00', '15:30', '18:30', '21:30'],
};

// Pricing tiers based on time
export const PRICING_CONFIG = {
  morning: 150,    // Before 12:00
  afternoon: 180,  // 12:00 - 18:00
  evening: 220,    // 18:00 - 21:00
  night: 200,      // After 21:00
};