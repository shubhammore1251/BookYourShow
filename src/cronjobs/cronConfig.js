import {scheduleMovies } from "@/cronjobs/cronFunction";

export const cronConfig = [
  { 
    schedule: "*/1 * * * *",
    job: scheduleMovies,
  },
];