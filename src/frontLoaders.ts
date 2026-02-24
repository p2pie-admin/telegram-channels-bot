import type { City } from "./types/city.js";

export type ParserCityDirections = Record<string, Record<string, number>>;

type Pm = {
  code: string;
  en_name: string;
  ru_name?: string;
  subgroup_name?: string;
  currency_code?: string;
  color?: string;
  icon?: {
    url?: string;
    alternativeText?: string | null;
    formats?: {
      thumbnail?: { url?: string };
      small?: { url?: string };
    };
  } | null;
  section: string;
};

type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

const toBool = (value?: string): boolean => String(value).toLowerCase() === "true";

const isProduction = (): boolean => process.env.NODE_ENV === "production";

const resolveInternalUrl = (external: string, internal?: string): string => {
  const useInternal = toBool(process.env.USE_INTERNAL);
  if (isProduction() && internal) return internal;
  return useInternal && internal ? internal : external;
};

const buildPublicUrl = (subdomain: "cms" | "server") => {
  const base = process.env.NEXT_PUBLIC_BASE || "p2pie.com";
  const index = process.env.NEXT_PUBLIC_INDEX === "0" ? "" : process.env.NEXT_PUBLIC_INDEX || "";
  return `https://${subdomain}${index}.${base}`;
};

const getCmsGraphqlUrl = (): string => {
  if (process.env.CMS_GRAPHQL_URL) {
    return process.env.CMS_GRAPHQL_URL;
  }

  const external = `${buildPublicUrl("cms")}/graphql`;
  const internal = process.env.INTERNAL_CMS_URL
    ? `${process.env.INTERNAL_CMS_URL.replace(/\/$/, "")}/graphql`
    : undefined;

  return resolveInternalUrl(external, internal);
};

const getServerBaseUrl = (): string => {
  if (process.env.SERVER_BASE_URL) {
    return process.env.SERVER_BASE_URL;
  }

  const external = buildPublicUrl("server");
  const internal = process.env.INTERNAL_SERVER_URL;
  return resolveInternalUrl(external, internal);
};

const cmsFetcher = async <T>(query: string): Promise<T | null> => {
  const response = await fetch(getCmsGraphqlUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.CMS_API_TOKEN
        ? { Authorization: `Bearer ${process.env.CMS_API_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as GraphqlResponse<T>;
  if (payload.errors?.length) {
    return null;
  }

  return (payload.data || null) as T | null;
};

export const parserFetcher = async <T>(slug: string): Promise<T | null> => {
  const response = await fetch(`${getServerBaseUrl().replace(/\/$/, "")}/${slug}`);

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
};

export const loadSimilarRates = async (
  dirs: string[],
  citySlug?: string,
): Promise<Array<[number, number] | null>> => {
  if (!dirs.length) return [];

  const cityQuery = citySlug ? `?city=${encodeURIComponent(citySlug.toLowerCase())}` : "";
  const payload =
    (await parserFetcher<Array<[number, number] | null>>(
      `similar/dirs=${dirs.join(",")}${cityQuery}`,
    )) || [];

  return Array.isArray(payload) ? payload : [];
};

export const loadPossibleDirs = async (): Promise<Record<string, number>> => {
  return (await parserFetcher<Record<string, number>>("dirs")) || {};
};

export type PopularRate = {
  exchangerId: string;
  course: number;
  fiat: string;
  exchangers?: number;
};

export type PopularDirRates = Record<
  string,
  {
    buy: Array<PopularRate | null>;
    sell: Array<PopularRate | null>;
  }
>;

export const loadPopular = async (citySlug?: string): Promise<PopularDirRates> => {
  const cityQuery = citySlug ? `?city=${encodeURIComponent(citySlug.toLowerCase())}` : "";
  return (await parserFetcher<PopularDirRates>(`top${cityQuery}`)) || {};
};

export const loadPms = async (): Promise<Pm[]> => {
  const query = `
    {
      pms(pagination: { start: 0, limit: 2000 }) {
        data {
          attributes {
            code
            pm_group {
              data {
                attributes {
                  en_name
                  ru_name
                  color
                  icon {
                    data {
                      attributes {
                        url
                        alternativeText
                        formats
                      }
                    }
                  }
                  options {
                    ... on ComponentSelectorSubgroup {
                      code
                      name
                      currency { data { attributes { code } } }
                    }
                    ... on ComponentSelectorCurrency {
                      currency { data { attributes { code } } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  type PmsQuery = {
    pms?: {
      data?: Array<{
        attributes?: {
          code?: string;
          pm_group?: {
            data?: {
              attributes?: {
                en_name?: string;
                ru_name?: string;
                color?: string;
                icon?: {
                  data?: {
                    attributes?: {
                      url?: string;
                      alternativeText?: string | null;
                      formats?: {
                        thumbnail?: { url?: string };
                        small?: { url?: string };
                      };
                    };
                  };
                };
                options?: Array<{
                  code?: string;
                  name?: string;
                  currency?: { data?: { attributes?: { code?: string } } };
                }>;
              };
            };
          };
        };
      }>;
    };
  };

  const data = await cmsFetcher<PmsQuery>(query);
  const rows = data?.pms?.data || [];

  return rows
    .map((row) => {
      const code = (row.attributes?.code || "").toUpperCase();
      if (!code) return null;

      const groupName = row.attributes?.pm_group?.data?.attributes?.en_name || code;
      const groupRuName = row.attributes?.pm_group?.data?.attributes?.ru_name || "";
      const groupColor = row.attributes?.pm_group?.data?.attributes?.color || "";
      const groupIcon = row.attributes?.pm_group?.data?.attributes?.icon?.data?.attributes || null;
      const options = row.attributes?.pm_group?.data?.attributes?.options || [];
      const option = options.find((item) => (item.code || "").toUpperCase() === code);

      const section =
        code.includes("CASH") || groupName.toLowerCase().includes("cash") ? "cash" : "other";

      return {
        code,
        en_name: groupName,
        ru_name: groupRuName,
        subgroup_name: option?.name || "",
        currency_code:
          option?.currency?.data?.attributes?.code ||
          options[0]?.currency?.data?.attributes?.code ||
          "",
        color: groupColor,
        icon: groupIcon,
        section,
      } as Pm;
    })
    .filter((item): item is Pm => Boolean(item));
};

export const isCashPm = (pm?: Pm | null): boolean =>
  !!pm &&
  ((pm.section && pm.section.toLowerCase() === "cash") ||
    pm.code?.toUpperCase().includes("CASH") ||
    pm.en_name?.toLowerCase().includes("cash"));

export const findCityBySlug = (cities: City[], slug: string): City | null => {
  const normalized = slug.toLowerCase();
  return cities.find((city) => city.en_name.toLowerCase() === normalized) || null;
};
