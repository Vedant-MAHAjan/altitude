import { format, formatDistanceToNowStrict } from "date-fns";

export function formatCurrency(value: number | null) {
  if (value === null) {
    return "Check listing";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPriceRange(min: number | null, max: number | null) {
  if (min === null && max === null) {
    return "Price pending scrape";
  }

  if (min !== null && max !== null && min !== max) {
    return `${formatCurrency(min)} to ${formatCurrency(max)}`;
  }

  return formatCurrency(min ?? max);
}

export function formatUpdatedAt(value: string | null) {
  if (!value) {
    return "Awaiting first scrape";
  }

  return format(new Date(value), "dd MMM yyyy, h:mm a");
}

export function formatUpdatedFromNow(value: string | null) {
  if (!value) {
    return "Awaiting first scrape";
  }

  return `${formatDistanceToNowStrict(new Date(value), {
    addSuffix: true,
  })}`;
}