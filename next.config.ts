import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   reactStrictMode: false,
   images: {
    domains: ["localhost", "lh3.googleusercontent.com", "image.tmdb.org", "encrypted-tbn0.gstatic.com"],
  },
};

export default nextConfig;
