import axios from "axios";

const TMDB_TOKEN = process.env.TMDB_TOKEN;

if (!TMDB_TOKEN) {
  throw new Error("Missing TMDB_TOKEN in env");
}

export const tmdb = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  headers: {
    Authorization: `Bearer ${TMDB_TOKEN}`,
    Accept: "application/json",
  },
});