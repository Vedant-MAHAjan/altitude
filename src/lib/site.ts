export const siteConfig = {
  name: "Altitude",
  description:
    "Compare Maharashtra trek packages across organizers by price, transport, meals, forest fee inclusion, pickup points, and freshness.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  botUserAgent: process.env.SCRAPE_USER_AGENT ?? "AltitudeBot/0.1",
  navItems: [
    { href: "/treks", label: "Treks" },
    { href: "/organizers", label: "Organizers" },
  ],
} as const;