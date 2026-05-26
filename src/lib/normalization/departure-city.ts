import { KNOWN_DEPARTURE_CITIES } from "../maharashtra-destinations";
import type { ListingCity } from "../types";
import { normalizeWhitespace } from "./extractors";

export type DepartureCitySource = "title" | "pickup" | "organizer-default" | "unknown";

type KnownDepartureCity = (typeof KNOWN_DEPARTURE_CITIES)[number];

const TITLE_CITY_TO_LISTING_CITY: Record<KnownDepartureCity, ListingCity> = {
  Mumbai: "MUMBAI",
  Pune: "PUNE",
  Nashik: "OTHER",
  Aurangabad: "OTHER",
  Nagpur: "OTHER",
  Thane: "MUMBAI",
  "Navi Mumbai": "MUMBAI",
};

const ORGANIZER_DEFAULT_DEPARTURE_CITIES: Record<string, ListingCity> = {
  bhatakna: "MUMBAI",
  durgvihar: "MUMBAI",
  "sahyadri-treks-and-tours": "PUNE",
  trekhievers: "MUMBAI",
  "treks-and-trails-india": "MUMBAI",
  "unlimited-trekers": "MUMBAI",
};

const PRIMARY_PICKUP_CITY_PATTERNS: Array<{
  cityLabel: string;
  listingCity: ListingCity;
  patterns: RegExp[];
}> = [
  {
    cityLabel: "Pune",
    listingCity: "PUNE",
    patterns: [
      /\bpune\b/i,
      /\bshivajinagar\b/i,
      /\bswargate\b/i,
      /\bwakad\b/i,
      /\bhinjawadi\b/i,
      /\bhinjewadi\b/i,
      /\bnigdi\b/i,
      /\bpimpri\b/i,
      /\bchinchwad\b/i,
      /\bnashik phata\b/i,
    ],
  },
  {
    cityLabel: "Mumbai",
    listingCity: "MUMBAI",
    patterns: [
      /\bmumbai\b/i,
      /\bcsmt\b/i,
      /\bbyculla\b/i,
      /\bborivali\b/i,
      /\bdadar\b/i,
      /\bkurla\b/i,
      /\bghatkopar\b/i,
      /\bmulund\b/i,
      /\bdombivali\b/i,
      /\bkalyan\b/i,
      /\bpanvel\b/i,
      /\bchembur\b/i,
      /\bsion\b/i,
      /\bkasara\b/i,
    ],
  },
  {
    cityLabel: "Thane",
    listingCity: "MUMBAI",
    patterns: [/\bthane\b/i],
  },
  {
    cityLabel: "Navi Mumbai",
    listingCity: "MUMBAI",
    patterns: [/\bnavi mumbai\b/i],
  },
  {
    cityLabel: "Nashik",
    listingCity: "OTHER",
    patterns: [/\bnashik\b/i, /\btrimbak phata\b/i],
  },
  {
    cityLabel: "Aurangabad",
    listingCity: "OTHER",
    patterns: [/\baurangabad\b/i],
  },
  {
    cityLabel: "Nagpur",
    listingCity: "OTHER",
    patterns: [/\bnagpur\b/i],
  },
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function coerceListingCity(value: unknown): ListingCity | null {
  switch (value) {
    case "MUMBAI":
    case "PUNE":
    case "MIXED":
    case "OTHER":
      return value;
    default:
      return null;
  }
}

function extractExplicitTitleCities(title: string): KnownDepartureCity[] {
  const normalizedTitle = normalizeWhitespace(title);

  if (!normalizedTitle) {
    return [];
  }

  return KNOWN_DEPARTURE_CITIES.filter((city) => {
    const escapedCity = escapeRegExp(city);

    return (
      new RegExp(`\\|[^|]*\\b${escapedCity}\\b`, "i").test(normalizedTitle) ||
      new RegExp(`\\bfrom\\s+${escapedCity}\\b`, "i").test(normalizedTitle) ||
      new RegExp(`\\(${escapedCity}\\)`, "i").test(normalizedTitle) ||
      new RegExp(`\\b${escapedCity}\\b(?:\\s+202[4-9])?$`, "i").test(normalizedTitle)
    );
  });
}

function mapTitleCitiesToListingCity(cities: KnownDepartureCity[]): ListingCity {
  const mappedCities = [...new Set(cities.map((city) => TITLE_CITY_TO_LISTING_CITY[city]))];

  if (mappedCities.includes("MUMBAI") && mappedCities.includes("PUNE")) {
    return "MIXED";
  }

  if (mappedCities.includes("MUMBAI")) {
    return "MUMBAI";
  }

  if (mappedCities.includes("PUNE")) {
    return "PUNE";
  }

  return "OTHER";
}

function derivePrimaryPickupCity(primaryPickupLocation: string | null) {
  const normalizedPickup = normalizeWhitespace(primaryPickupLocation);

  if (!normalizedPickup) {
    return null;
  }

  for (const candidate of PRIMARY_PICKUP_CITY_PATTERNS) {
    if (candidate.patterns.some((pattern) => pattern.test(normalizedPickup))) {
      return {
        cityLabel: candidate.cityLabel,
        listingCity: candidate.listingCity,
      };
    }
  }

  return null;
}

export function resolveOrganizerDefaultDepartureCity(
  organizerSlug: string | null | undefined,
): ListingCity {
  return ORGANIZER_DEFAULT_DEPARTURE_CITIES[organizerSlug ?? ""] ?? "OTHER";
}

export function resolveDepartureCityAssignment(input: {
  title: string;
  pickupLocations: string[];
  organizerSlug?: string | null;
}) {
  const titleCities = extractExplicitTitleCities(input.title);

  if (titleCities.length > 0) {
    return {
      listingCity: mapTitleCitiesToListingCity(titleCities),
      citySource: "title" as const,
      matchedCity: titleCities.join(", "),
    };
  }

  const primaryPickupLocation = input.pickupLocations.find(Boolean) ?? null;
  const pickupCity = derivePrimaryPickupCity(primaryPickupLocation);

  if (pickupCity) {
    return {
      listingCity: pickupCity.listingCity,
      citySource: "pickup" as const,
      matchedCity: pickupCity.cityLabel,
    };
  }

  const defaultDepartureCity = resolveOrganizerDefaultDepartureCity(input.organizerSlug);

  if (defaultDepartureCity !== "OTHER") {
    return {
      listingCity: defaultDepartureCity,
      citySource: "organizer-default" as const,
      matchedCity: defaultDepartureCity === "MUMBAI" ? "Mumbai" : "Pune",
    };
  }

  return {
    listingCity: "OTHER" as const,
    citySource: "unknown" as const,
    matchedCity: null,
  };
}