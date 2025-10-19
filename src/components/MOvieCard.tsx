// src/components/MovieCard.tsx
import { IconStarFilled } from "@tabler/icons-react";
import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '');    // remove leading/trailing hyphens
}

let fallbackImage = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpT3NuL8oMTj760VFk9yKuyn0xsPApH-rFpRAlw4Qqotev1t7Z1JR-RDCtaTpREgRmNsM";

export default function MovieCard({ movie }: { movie: any }) {
  const genres = (movie.genre_names || []).slice(0, 2).join(", ");

  return (
    <Link href={`/movies/${slugify(movie.title)}/${movie.id}`} className="block">
      <div className="w-50 md:w-60">
        <div className="rounded overflow-hidden shadow">
          <Image
            priority
            width={150}
            height={500}
            src={movie?.posterUrl ?? fallbackImage}
            alt={movie.title}
            className="w-full h-80 object-cover"
          />
        </div>
        <div className="mt-2 space-y-1">
          <h3 className="text-sm font-semibold leading-tight">{movie.title}</h3>
          <p className="text-xs flex items-center gap-1 text-muted-foreground">
            Ratings: <IconStarFilled className="text-yellow-500 w-4 h-4" />
            {movie?.rating?.toFixed(1)} / 10
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {movie?.voteCount} reviews
          </div>
          <div className="text-xs text-muted-foreground">{genres}</div>
        </div>
      </div>
    </Link>
  );
}
