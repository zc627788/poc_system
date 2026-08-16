import type { NextConfig } from "next";

const configuredApiBaseUrl =
  process.env.INTERNAL_API_BASE_URL || "http://127.0.0.1:8000/api";

const apiOrigin = configuredApiBaseUrl.replace(/\/api\/?$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  images: {
    unoptimized: true
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`
      },
      {
        source: "/prototype-assets/:path*",
        destination: `${apiOrigin}/prototype-assets/:path*`
      },
      {
        source: "/uploads/:path*",
        destination: `${apiOrigin}/uploads/:path*`
      }
    ];
  }
};

export default nextConfig;
