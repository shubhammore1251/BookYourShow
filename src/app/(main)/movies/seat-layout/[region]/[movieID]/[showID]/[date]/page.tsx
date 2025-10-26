import React from 'react'
import { Metadata } from "next";
import BookTicketPage from '@/app/(main)/movies/components/BookTicketPage';

type Props = {
  params: {
    region: string;
    movieID: string;
    showID: string;
    date: string;
  };
};

// ✅ Page component (server-side)
const Page = async ({ params }: Props) => {
  const { movieID, showID, date, region } = params;

  return (
    <BookTicketPage
      movieId={movieID}
      showId={showID}
      date={date}
      region={region}
    />
  );
};

export default Page;