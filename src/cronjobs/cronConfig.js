import {scheduleMovies } from "@/cronjobs/cronFunction";

export const cronConfig = [
  { 
    schedule: "0 0 * * *",
    job: scheduleMovies,
  },
];