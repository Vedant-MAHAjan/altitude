export const siteConfig = {
  name: "MahaTrek Compare",
  description:
    "Compare Maharashtra trek packages across organizers by price, transport, meals, forest fee inclusion, pickup points, and freshness.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  navItems: [
    { href: "/treks", label: "Treks" },
    { href: "/organizers", label: "Organizers" },
    { href: "/api/treks", label: "API" },
  ],
} as const;