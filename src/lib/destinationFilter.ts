import type { Destination } from "@/types/flight";

export function normalizeArabic(text: string): string {
  return text
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[\u0622\u0623\u0625]/g, '\u0627')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0649/g, '\u064A');
}

export interface FilteredDestination extends Destination {
  isCountryMatch: boolean;
}

export interface FilterResult {
  destinations: FilteredDestination[];
  matchedCountry: string | null;
}

export function filterDestinations(
  destinations: Destination[],
  query: string
): FilterResult {
  if (!query) {
    return {
      destinations: destinations.map((d) => ({ ...d, isCountryMatch: false })),
      matchedCountry: null,
    };
  }

  const lower = query.toLowerCase();

  const normalizedQuery = normalizeArabic(query);

  // Check if the query matches any country name
  const countryMatches = new Set<string>();
  for (const d of destinations) {
    if (normalizeArabic(d.country_ar).includes(normalizedQuery)) {
      countryMatches.add(d.country_ar);
    }
  }

  // Determine the matched country (use the first one found, or null)
  const matchedCountry =
    countryMatches.size === 1 ? Array.from(countryMatches)[0] : null;

  const results: FilteredDestination[] = [];

  for (const d of destinations) {
    const cityMatch =
      normalizeArabic(d.city_ar).includes(normalizedQuery) ||
      d.city.toLowerCase().includes(lower) ||
      d.airport_code.toLowerCase().includes(lower) ||
      normalizeArabic(d.airport_name_ar).includes(normalizedQuery) ||
      d.airport_name.toLowerCase().includes(lower);
    const countryMatch = normalizeArabic(d.country_ar).includes(normalizedQuery);

    if (cityMatch || countryMatch) {
      results.push({
        ...d,
        isCountryMatch: countryMatch && !cityMatch,
      });
    }
  }

  // Sort: country-only matches after direct city matches
  results.sort((a, b) => {
    if (a.isCountryMatch && !b.isCountryMatch) return 1;
    if (!a.isCountryMatch && b.isCountryMatch) return -1;
    return 0;
  });

  return { destinations: results, matchedCountry };
}
