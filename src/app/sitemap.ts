import type { MetadataRoute } from "next";

import { getOrganizerIndex, getTreksIndex } from "@/lib/data";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [treks, organizers] = await Promise.all([
    getTreksIndex(),
    getOrganizerIndex(),
  ]);

  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/treks`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/organizers`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    ...treks.map((trek) => ({
      url: `${siteConfig.url}/treks/${trek.slug}`,
      lastModified: trek.updatedAt ? new Date(trek.updatedAt) : new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...organizers.map((organizer) => ({
      url: `${siteConfig.url}/organizers/${organizer.slug}`,
      lastModified: organizer.updatedAt ? new Date(organizer.updatedAt) : new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}