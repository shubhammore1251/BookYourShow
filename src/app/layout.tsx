import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { Toaster } from "react-hot-toast";
import AuthInitializer from "@/components/AuthInitializer";
import { GoogleOAuthProvider } from "@react-oauth/google";
import cronManager from "@/cronjobs/cronManager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BookYourShow - Movie Tickets & Entertainment",
    template: "%s | BookYourShow",
  },
  description: "Book movie tickets, events, and shows easily with BookYourShow.",
  openGraph: {
    title: "BookYourShow - Movie Tickets & Entertainment",
    description: "Book movie tickets, events, and shows easily with BookYourShow.",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}`,
    siteName: "BookYourShow",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`,
        width: 1200,
        height: 630,
        alt: "BookYourShow",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BookYourShow - Movie Tickets & Entertainment",
    description: "Book movie tickets, events, and shows easily with BookYourShow.",
    images: [`${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`],
  },
};

const manager = new cronManager();
manager.addJobsFromConfig();
manager.startJobs();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthInitializer />
         <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          {children}
        </GoogleOAuthProvider>
        <Toaster position="top-center" reverseOrder={true} toastOptions={{ duration: 3000 }} />
      </body>
    </html>
  );
}
