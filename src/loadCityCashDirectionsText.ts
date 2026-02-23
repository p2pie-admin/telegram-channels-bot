import { loadCities } from "./loadCities.js";
import {
  findCityBySlug,
  isCashPm,
  loadSimilarRates,
  loadPms,
  loadPossibleDirs,
  parserFetcher,
  type ParserCityDirections,
} from "./frontLoaders.js";
import type { ReportRow } from "./report-card/SendCityRateReportCard.js";

const MIN_RATE = 1;

const capitalize = (value: string): string =>
  value ? value[0].toUpperCase() + value.slice(1) : value;

const toTelegramSafe = (text: string): string => {
  if (text.length <= 3900) return text;
  return `${text.slice(0, 3850)}\n\n... (обрезано)`;
};

const formatPm = (pm?: { en_name: string; subgroup_name?: string; currency_code?: string } | null): string => {
  if (!pm) return "Unknown";
  const base = capitalize((pm.en_name || "").slice(0, 20));
  const suffix = (pm.subgroup_name || "").toUpperCase() || (pm.currency_code || "").toUpperCase();
  return suffix ? `${base} ${suffix}` : base;
};

const formatRate = (course?: number, giveCur?: string, getCur?: string): string => {
  if (!course || !giveCur || !getCur) return "";
  if (course < 1) {
    return `1 ${giveCur} = ${(1 / course).toFixed(1)} ${getCur}`;
  }
  return `${course.toFixed(1)} ${giveCur} = 1 ${getCur}`;
};

export type CityRatesPayload = {
  citySlug: string;
  cityName: string;
  text: string;
  coursesCount: number;
  cardRows: ReportRow[];
};

export const loadCityCashDirectionsText = async (
  citySlug: string,
): Promise<CityRatesPayload | null> => {
  const [cities, cityDirectionsData, pms, allPossibleDirs] = await Promise.all([
    loadCities(),
    parserFetcher<ParserCityDirections>("non_empty_cities"),
    loadPms(),
    loadPossibleDirs(),
  ]);

  if (!cityDirectionsData) return null;

  const city = findCityBySlug(cities, citySlug);
  if (!city) return null;

  const currentCityDirections = cityDirectionsData[city.en_name.toLowerCase()] || {};
  const allowedDirs = new Set(Object.keys(allPossibleDirs || {}));
  const pmMap = new Map(pms.map((pm) => [pm.code.toUpperCase(), pm]));

  const buyLines: string[] = [];
  const sellLines: string[] = [];
  const cardRows: ReportRow[] = [];
  let coursesCount = 0;

  const candidateDirs = Object.entries(currentCityDirections)
    .filter(([dir, count]) => allowedDirs.has(dir) && typeof count === "number" && count > MIN_RATE)
    .sort((a, b) => b[1] - a[1]);

  const dirCodes = candidateDirs.map(([dir]) => dir);
  const similarByDir = new Map<string, [number, number] | null>();
  if (dirCodes.length) {
    const similarList = await loadSimilarRates(dirCodes, city.en_name.toLowerCase());
    dirCodes.forEach((dir, index) => {
      similarByDir.set(dir, similarList[index] || null);
    });
  }

  candidateDirs.forEach(([dir, fallbackCount]) => {
      const [giveCodeRaw, getCodeRaw] = dir.split("_");
      const givePm = pmMap.get((giveCodeRaw || "").toUpperCase());
      const getPm = pmMap.get((getCodeRaw || "").toUpperCase());
      if (!givePm || !getPm) return;

      const giveIsCash = isCashPm(givePm);
      const getIsCash = isCashPm(getPm);
      if (giveIsCash === getIsCash) return;

      const [course, similarCount] = similarByDir.get(dir) || [];
      const offersCount = typeof similarCount === "number" && similarCount > 0 ? similarCount : fallbackCount;
      const line = `${formatPm(givePm)} -> ${formatPm(getPm)}`;
      const rateText = formatRate(
        course,
        (givePm.currency_code || "").toUpperCase(),
        (getPm.currency_code || "").toUpperCase(),
      );
      const suffix = rateText
        ? `(Предложений: ${offersCount}, Курс: ${rateText})`
        : `(Предложений: ${offersCount})`;
      coursesCount += offersCount;

      if (giveIsCash) {
        buyLines.push(`- ${line} ${suffix}`);
      } else {
        sellLines.push(`- ${line} ${suffix}`);
      }

      if (cardRows.length < 10) {
        cardRows.push({ label: line, value: offersCount });
      }
    });

  if (!buyLines.length && !sellLines.length) return null;

  const cityMapUrl = `https://p2pie.com/map/${city.en_name.toLowerCase()}`;
  const lines: string[] = [
    `Популярные обмены в <a href="${cityMapUrl}">${city.preposition || city.ru_name}</a>`,
  ];
  if (buyLines.length) {
    lines.push("", "Купить криптовалюту за наличные:", ...buyLines);
  }
  if (sellLines.length) {
    lines.push("", "Продать криптовалюту за наличные:", ...sellLines);
  }

  return {
    citySlug: city.en_name.toLowerCase(),
    cityName: city.ru_name,
    text: toTelegramSafe(lines.join("\n")),
    coursesCount,
    cardRows,
  };
};
