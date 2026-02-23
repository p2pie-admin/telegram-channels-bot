import { loadPopular, loadPms, type PopularRate } from "./frontLoaders.js";

type PmLite = {
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

export type PopularBanksRow = {
  bank: string;
  buyLabel: string;
  buyUrl?: string;
  sellLabel: string;
  sellUrl?: string;
  buyExchangers?: number;
  sellExchangers?: number;
};

export type PopularBanksSection = {
  cryptoCode: string;
  pm?: Pick<PmLite, "code" | "en_name" | "subgroup_name" | "color" | "icon">;
  rows: PopularBanksRow[];
  exchangersCount?: number;
};

const capitalize = (value?: string): string => (value ? value[0].toUpperCase() + value.slice(1) : "");

const stick = (num: number) => {
  if (num < 1) return num;
  let mult = 0;
  while (num % 10 === 0) {
    mult += 1;
    num /= 10;
  }
  if (num < 10) return num * 10 ** mult;
  const lastDigit = num % 10;
  if (lastDigit === 4 || lastDigit === 9) return (num + 1) * 10 ** mult;
  if (lastDigit === 6 || lastDigit === 1) return (num - 1) * 10 ** mult;
  return num * 10 ** mult;
};

const R = (amount: number, strength = 1): number => {
  if (!amount || typeof amount !== "number" || strength >= 4) return 0;
  const s = 4 - strength;

  if (amount > 100 && s < 3) {
    const digits = amount.toFixed(0).length - 1;
    const tmp = (amount / 10 ** digits).toFixed(6 - s);
    let res = +(+tmp * 10 ** digits).toFixed(0);

    if (strength === 3) {
      const magnitude = 10 ** digits;
      res = Math.ceil(amount / magnitude) * magnitude;
    }
    if (strength === 2) {
      const magnitude = 10 ** (digits - 1);
      res = Math.round(amount / magnitude) * magnitude;
    }
    return stick(res);
  }

  const orderOfMagnitude = -Math.floor(Math.log10(amount / 10 ** s));
  const precision = orderOfMagnitude < 0 ? 0 : orderOfMagnitude;
  return +amount.toFixed(precision);
};

const addSpaces = (x: string | number) => {
  const s = String(x);
  if (!x && x !== 0) return s;
  if (s.length > 9) return "✖";
  const parts = s.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return parts.join(".");
};

const formatNumber = (value?: number): string => {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return addSpaces(R(value, 1));
};

const curToSymbol = (code?: string): string => {
  switch ((code || "").toUpperCase()) {
    case "RUB":
      return "₽";
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "KZT":
      return "₸";
    case "UAH":
      return "₴";
    default:
      return "";
  }
};

const slugify = (value?: string): string => (value || "").toLowerCase().replaceAll(" ", "").replaceAll("/", "");

const pmsToSlug = (givePm?: PmLite, getPm?: PmLite): string => {
  if (!givePm || !getPm) return "";
  const giveSubgroup = givePm.subgroup_name ? `-${givePm.subgroup_name}` : "";
  const getSubgroup = getPm.subgroup_name ? `-${getPm.subgroup_name}` : "";
  return slugify(
    `${givePm.en_name}-${givePm.currency_code || ""}${giveSubgroup}-to-${getPm.en_name}-${getPm.currency_code || ""}${getSubgroup}`,
  );
};

const pmLabel = (pm?: PmLite): string => {
  if (!pm) return "Unknown";
  const base = capitalize(pm.ru_name || pm.en_name || pm.code);
  const suffix = (pm.subgroup_name || "").toUpperCase();
  return suffix ? `${base} ${suffix}` : base;
};

const buildRow = (
  row: { buy?: PopularRate; sell?: PopularRate },
  fiatPm: PmLite | undefined,
  cryptoPm: PmLite,
): PopularBanksRow => {
  const buySlug = row.buy && fiatPm ? pmsToSlug(fiatPm, cryptoPm) : "";
  const sellSlug = row.sell && fiatPm ? pmsToSlug(cryptoPm, fiatPm) : "";
  const buyCourse = row.buy?.course;
  const sellCourse = row.sell?.course;
  return {
    bank: pmLabel(fiatPm),
    buyLabel: typeof buyCourse === "number" ? `${curToSymbol(fiatPm?.currency_code)} ${formatNumber(buyCourse)}`.trim() : "—",
    buyUrl: buySlug ? `https://p2pie.com/${buySlug}` : undefined,
    sellLabel: typeof sellCourse === "number" ? `${curToSymbol(cryptoPm.currency_code)} ${formatNumber(sellCourse)}`.trim() : "—",
    sellUrl: sellSlug ? `https://p2pie.com/${sellSlug}` : undefined,
    buyExchangers: row.buy?.exchangers,
    sellExchangers: row.sell?.exchangers,
  };
};

export const loadPopularBanksTable = async (citySlug?: string): Promise<PopularBanksSection[]> => {
  const [popular, pms] = await Promise.all([loadPopular(citySlug), loadPms()]);
  const pmMap = new Map((pms || []).map((pm) => [pm.code.toUpperCase(), pm as PmLite]));
  const sections: PopularBanksSection[] = [];

  for (const [cryptoCode, buySell] of Object.entries(popular || {})) {
    const cryptoPm = pmMap.get(cryptoCode.toUpperCase());
    if (!cryptoPm) continue;

    const byFiat = new Map<string, { buy?: PopularRate; sell?: PopularRate }>();
    for (const item of buySell.buy || []) {
      if (!item) continue;
      const key = (item.fiat || "").toUpperCase();
      if (!key) continue;
      byFiat.set(key, { ...(byFiat.get(key) || {}), buy: item });
    }
    for (const item of buySell.sell || []) {
      if (!item) continue;
      const key = (item.fiat || "").toUpperCase();
      if (!key) continue;
      byFiat.set(key, { ...(byFiat.get(key) || {}), sell: item });
    }

    const rows = [...byFiat.entries()].map(([fiatCode, row]) => {
      const fiatPm = pmMap.get(fiatCode);
      return buildRow(row, fiatPm, cryptoPm);
    });

    if (rows.length) {
      const exchangersCount =
        (buySell.buy.find((item) => item)?.exchangers as number | undefined) ??
        (buySell.sell.find((item) => item)?.exchangers as number | undefined) ??
        0;
      sections.push({
        cryptoCode: cryptoCode.toUpperCase(),
        pm: cryptoPm
          ? {
            en_name: cryptoPm.en_name,
            code: cryptoPm.code,
            subgroup_name: cryptoPm.subgroup_name,
            color: cryptoPm.color,
            icon: cryptoPm.icon,
            }
          : undefined,
        rows,
        exchangersCount,
      });
    }
  }

  return sections;
};

export const loadPopularBanksText = async (citySlug?: string): Promise<string | null> => {
  const sections = await loadPopularBanksTable(citySlug);
  if (!sections.length) return null;

  const lines: string[] = ["<b>Популярные направления (Банки)</b>"];
  for (const section of sections) {
    lines.push("", `<b>${section.cryptoCode}</b>`, "Банк | Купить | Продать");
    for (const row of section.rows) {
      const buyCell = row.buyUrl ? `<a href="${row.buyUrl}">${row.buyLabel}</a>` : row.buyLabel;
      const sellCell = row.sellUrl ? `<a href="${row.sellUrl}">${row.sellLabel}</a>` : row.sellLabel;
      lines.push(`${row.bank} | ${buyCell} | ${sellCell}`);
    }
  }
  return lines.join("\n");
};
