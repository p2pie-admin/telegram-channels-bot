import type { City } from "./types/city.js";

type ParserSettingResponse = {
  parserSetting?: {
    data?: {
      attributes?: {
        cities?: City[];
      };
    };
  };
};

let citiesCache: City[] | null = null;
let citiesCacheAt = 0;
const CITIES_CACHE_TTL_MS = 10 * 60 * 1000;

const CITIES_QUERY = `
  {
    parserSetting {
      data {
        attributes {
          cities
        }
      }
    }
  }
`;

const resolveCmsGraphqlUrl = (): string => {
  if (process.env.CMS_GRAPHQL_URL) {
    return process.env.CMS_GRAPHQL_URL;
  }

  const base = process.env.NEXT_PUBLIC_BASE;
  if (!base) {
    throw new Error("CMS_GRAPHQL_URL or NEXT_PUBLIC_BASE is required to load cities");
  }

  const index = process.env.NEXT_PUBLIC_INDEX === "0" ? "" : process.env.NEXT_PUBLIC_INDEX || "";
  return `https://cms${index}.${base}/graphql`;
};

export const loadCities = async (): Promise<City[]> => {
  const now = Date.now();
  if (citiesCache && now - citiesCacheAt < CITIES_CACHE_TTL_MS) {
    return citiesCache;
  }

  const endpoint = resolveCmsGraphqlUrl();

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.CMS_API_TOKEN
          ? { Authorization: `Bearer ${process.env.CMS_API_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({ query: CITIES_QUERY }),
    });

    if (!response.ok) {
      throw new Error(`Failed to load cities: HTTP ${response.status}`);
    }

    const payload = (await response.json()) as {
      data?: ParserSettingResponse;
      errors?: Array<{ message?: string }>;
    };

    if (payload.errors?.length) {
      throw new Error(payload.errors.map((error) => error.message || "Unknown GraphQL error").join("; "));
    }

    const cities = payload.data?.parserSetting?.data?.attributes?.cities || [];
    citiesCache = cities;
    citiesCacheAt = now;
    return cities;
  } catch (error) {
    if (citiesCache?.length) {
      console.warn("[loadCities] Using cached cities after fetch error:", error);
      return citiesCache;
    }
    throw error;
  }
};
