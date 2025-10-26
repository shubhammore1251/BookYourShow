import {deleteScheduledShows, scheduleMovies } from "@/cronjobs/cronFunction";

// Schedule shows production time: "0 2 * * *"   2 AM every day
// Delete expired shows: "*/30 * * * *"           every minute

export const cronConfig = [
  { 
    schedule: "0 2 * * *",
    job: scheduleMovies,
  },
  {
    schedule: "*/1 * * * *",
    job: deleteScheduledShows,
  }
];