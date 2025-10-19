import React from 'react'
import MovieDetailsPage from './MovieDetailsPage';
import { Metadata } from 'next';
 
type Props = {
  params: {
    id: string;
    title: string;
  };
};
// dynamic SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { title, id } = await params;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/movies/${id}`, {
    next: { revalidate: 3600 },
  });
  const movie = await res.json();
  const movieDetails = movie.data.movieDetails;
  return {
    title: `${movieDetails?.title ?? title} | BookYourShow`,
    description: movieDetails?.overview || "Watch the latest movies on BookYourShow.",
    openGraph: {
      title: movieDetails?.title ?? title,
      description: movieDetails?.overview ?? 'Watch the latest movies on BookYourShow.',
      images: [`https://image.tmdb.org/t/p/original${movieDetails?.poster_path}`],
      url: `${process.env.NEXT_PUBLIC_API_URL}/${title}/${id}`,
      type: "video.movie",
    },
    twitter: {
      card: "summary_large_image",
      title: movieDetails?.title ?? title,
      description: movieDetails?.overview ?? 'Watch the latest movies on BookYourShow.',
      images: [`https://image.tmdb.org/t/p/original${movieDetails?.poster_path}`],
    },
  };
}




const page = async ({ params }: { params: { id: string } }) => {
   const { id } = params;
   return <MovieDetailsPage id={id}  />
}

export default page