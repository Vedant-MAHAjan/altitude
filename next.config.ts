import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  typedRoutes: true,

  // Keep Playwright and heavy scraper deps out of serverless bundles
  serverExternalPackages: ["playwright", "playwright-core"],

  // Compress responses
  compress: true,

  // Security + caching headers
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    },
    {
      // Cache static snapshots aggressively — they're refreshed by scraper commits
      source: "/snapshots/:path*",
      headers: [
        { key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400" },
      ],
    },
  ],

  // Exclude scraper source from client/server analysis during build
};

export default nextConfig;
