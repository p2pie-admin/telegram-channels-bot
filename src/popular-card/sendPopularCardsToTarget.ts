import { Bot, InputFile } from "grammy";
import { loadPopularBanksTable } from "../loadPopularBanksText.js";
import type { City } from "../types/city.js";
import { generatePopularCardImage } from "./generatePopularCardImage.js";

const toCityQuery = (city?: City | null, citySlug?: string): string => {
  const raw = city?.en_name || citySlug || "";
  return raw.toLowerCase().replaceAll(" ", "-");
};

const buildCaption = (
  sections: Awaited<ReturnType<typeof loadPopularBanksTable>>,
  city?: City | null,
  citySlug?: string,
): string => {
  const cityQuery = toCityQuery(city, citySlug);
  const cryptos = sections
    .map((section) => ({
      code: (section.pm?.code || "").toLowerCase(),
      label: section.cryptoCode.toUpperCase(),
    }))
    .filter((item) => item.code && item.label);

  if (!cryptos.length || !cityQuery) {
    return citySlug ? `Популярные курсы (${citySlug})` : "Популярные курсы";
  }

  const buyLinks = cryptos
    .map(
      ({ code, label }) =>
        `<a href="https://p2pie.com/buy/${encodeURIComponent(code)}-for-rub?city=${encodeURIComponent(cityQuery)}">${label.slice(0, 4)}</a>`,
    )
    .join(" | ");

  const sellLinks = cryptos
    .map(
      ({ code, label }) =>
        `<a href="https://p2pie.com/sell/${encodeURIComponent(code)}-for-rub?city=${encodeURIComponent(cityQuery)}">${label.slice(0, 4)}</a>`,
    )
    .join(" | ");

  return `Купить ........ ${buyLinks}\nПродать ...... ${sellLinks}\n\ <a href="https://p2pie.com">p2pie</a> — это агрегатор проверенных обменников, участников <a href="https://www.bestchange.ru/">BestChange</a>, <a href="https://kurs.expert/">KursExpert</a>, <a href="https://exnode.ru/">ExNode</a> и др. \nСервис не участвует в финансовых операциях.`;
};

export const sendPopularCardsToTarget = async (
  bot: Bot,
  target: string | number,
  citySlug?: string,
  city?: City | null,
): Promise<{ sent: boolean; sections: number }> => {
  const sections = await loadPopularBanksTable(citySlug);
  if (!sections.length) return { sent: false, sections: 0 };

  try {
    const imagePath = await generatePopularCardImage(sections, city || null);
    await bot.api.sendPhoto(target, new InputFile(imagePath), {
      caption: buildCaption(sections, city, citySlug),
      parse_mode: "HTML",
    });
    return { sent: true, sections: sections.length };
  } catch (error) {
    console.error("[sendPopularCardsToTarget] Failed:", error);
    return { sent: false, sections: 0 };
  }
};
