export type Movie = {
  id: number;
  title: string;
  overview: string;
  genres: string[];
  rating: number;
  posterUrl: string;
  releaseDate: string; // or Date if you plan to parse it
  voteCount: number;
};

export interface MovieDetails {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  runtime: number;
  release_date: string;
  genres: Array<{ id: number; name: string }>;
  overview: string;
  original_language: string;
  spoken_languages: Array<{ english_name: string }>;
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface Review {
  id: string;
  author: string;
  author_details: {
    rating: number | null;
    avatar_path: string | null;
  };
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface Certification {
  certification: string;
  meaning: string;
  order: number;
}

export interface MovieData {
  movieDetails: MovieDetails;
  cast: CastMember[];
  crew: CrewMember[];
  reviews: Review[];
  videos: Video[];
}
