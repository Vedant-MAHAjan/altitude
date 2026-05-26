const taglines = [
  "Trail-tested & approved",
  "Pack light, hike far",
  "Where WiFi dies, adventure begins",
  "Fog is just mountain mood lighting",
  "Your desk misses you (don't go back)",
  "Boots > heels",
  "Leg day regret guaranteed",
  "Earns you bragging rights",
  "Worth the muscle soreness",
  "Weekend warrior friendly",
  "First-timer approved",
  "Easy on the knees",
  "Instagram crowd favorite",
  "Everyone's been here (go anyway)",
  "The group-trip classic",
  "Clouds > visibility",
  "Sunrise chasers unite",
  "Camera roll filler",
  "Stargazing included",
  "Sleep with nature (literally)",
  "Tent life > real life",
  "You will get drenched",
  "Monsoon mandatory",
  "Nature's shower awaits",
  "Headlamp vibes only",
  "Stars & sore calves",
  "Midnight trail magic",
  "Not for flip-flop heroes",
  "Quads will remember this",
  "Monsoon-soaked and worth it",
];

/**
 * Simple deterministic hash from a string to a positive integer.
 * Uses djb2 algorithm variant.
 */
function slugHash(slug: string): number {
  let hash = 5381;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) + hash + slug.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Returns a deterministic tagline for a given trek slug.
 * The same slug always maps to the same tagline.
 */
export function getTaglineForSlug(slug: string): string {
  return taglines[slugHash(slug) % taglines.length];
}
