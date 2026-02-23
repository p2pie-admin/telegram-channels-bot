import { Bot, InputFile } from "grammy";
import { loadCityCashDirectionsText } from "./loadCityCashDirectionsText.js";
import { generateReportCardImage } from "./report-card/generateReportCardImage.js";

const toCaptionSafe = (text: string): string => {
  const MAX_CAPTION = 1024;
  if (text.length <= MAX_CAPTION) {
    return text;
  }
  return `${text.slice(0, 980)}\n\n... (обрезано)`;
};

export const sendCityRatesToTarget = async (
  bot: Bot,
  target: string | number,
  citySlug: string,
): Promise<{ sent: boolean; count: number }> => {
  const payload = await loadCityCashDirectionsText(citySlug);
  if (!payload) {
    return { sent: false, count: 0 };
  }

  let imageSent = false;
  try {
    const imagePath = await generateReportCardImage({
      cityTitle: `Курсы в городе ${payload.cityName}`,
      subtitle: `Город: ${payload.citySlug}`,
      rows: payload.cardRows,
    });

    await bot.api.sendPhoto(target, new InputFile(imagePath), {
      caption: toCaptionSafe(payload.text),
      parse_mode: "HTML",
    });
    imageSent = true;
  } catch (error) {
    console.error(`[sendCityRatesToTarget] Failed to generate/send image for ${citySlug}:`, error);
  }

  if (!imageSent) {
    await bot.api.sendMessage(target, payload.text, { parse_mode: "HTML" });
  }

  return { sent: true, count: payload.coursesCount || (imageSent ? 1 : payload.coursesCount) };
};
