import type { Metadata } from "next";

import { siteConfig } from "@/lib/site";

type BuildMetadataOptions = {
  title: string;
  description: string;
  path: string;
};

/**
 * Build consistent page metadata with correct canonical and og:url values
 * derived from NEXT_PUBLIC_SITE_URL + the page path.
 */
export function buildMetadata({ title, description, path }: BuildMetadataOptions): Metadata {
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;
  const fullUrl = `${siteConfig.url}${canonicalPath}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: fullUrl,
    },
  };
}
