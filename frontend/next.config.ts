import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "victorian-dependent-era-believes.trycloudflare.com",
    "localhost:7700",
    "127.0.0.1:7700",
  ],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://localhost:5050/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
