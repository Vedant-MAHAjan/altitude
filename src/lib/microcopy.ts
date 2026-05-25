const trekLabels: Record<string, string[]> = {
  easy: [
    "Weekend warrior friendly",
    "First-timer approved",
    "Easy on the knees",
  ],
  moderate: [
    "Leg day regret guaranteed",
    "Earns you bragging rights",
    "Worth the muscle soreness",
  ],
  hard: [
    "Not for flip-flop heroes",
    "Quads will remember this",
    "Monsoon-soaked and worth it",
  ],
  popular: [
    "Instagram crowd favorite",
    "Everyone's been here (go anyway)",
    "The group-trip classic",
  ],
  scenic: [
    "Clouds > visibility",
    "Sunrise chasers unite",
    "Camera roll filler",
  ],
  camping: [
    "Stargazing included",
    "Sleep with nature (literally)",
    "Tent life > real life",
  ],
  waterfall: [
    "You will get drenched",
    "Monsoon mandatory",
    "Nature's shower awaits",
  ],
  night: [
    "Headlamp vibes only",
    "Stars & sore calves",
    "Midnight trail magic",
  ],
};

const genericLabels = [
  "Trail-tested & approved",
  "Pack light, hike far",
  "Where WiFi dies, adventure begins",
  "Fog is just mountain mood lighting",
  "Your desk misses you (don't go back)",
  "Boots > heels",
];

export function getTrekMicrocopy(
  tags: string[] = [],
): string {
  for (const tag of tags) {
    const options = trekLabels[tag.toLowerCase()];
    if (options) {
      return options[Math.floor(Math.random() * options.length)];
    }
  }

  return genericLabels[Math.floor(Math.random() * genericLabels.length)];
}

export function getStaticTrekLabel(index: number): string {
  return genericLabels[index % genericLabels.length];
}
