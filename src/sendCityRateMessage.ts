import type { Bot } from "grammy";
import { loadCities } from "./loadCities.js";
import { sendPopularCardsToTarget } from "./popular-card/sendPopularCardsToTarget.js";

export type SendCityRateMessageResult = {
  report: Array<{ channel: string; count: number }>;
};

const botIsChannelAdmin = async (
  bot: Bot,
  botId: number,
  channel: string,
): Promise<boolean> => {
  try {
    const member = await bot.api.getChatMember(`@${channel}`, botId);
    return member.status === "administrator" || member.status === "creator";
  } catch {
    return false;
  }
};

export const sendCityRateMessage = async (
  bot: Bot,
  onProgress?: (item: { channel: string; count: number }) => Promise<void> | void,
): Promise<SendCityRateMessageResult> => {
  const cities = await loadCities();
  const me = await bot.api.getMe();
  console.log(`[sendCityRateMessage] Loaded cities: ${cities.length}`);

  const report: Array<{ channel: string; count: number }> = [];

  for (const city of cities) {
    const citySlug = city.en_name.toLowerCase();
    const channel = city.channel?.trim() || `obmennik_${citySlug}`;
    const isAdmin = await botIsChannelAdmin(bot, me.id, channel);

    if (!isAdmin) {
      continue;
    }

    try {
      const result = await sendPopularCardsToTarget(bot, `@${channel}`, citySlug, city);
      if (!result.sent) {
        report.push({ channel, count: 0 });
        await onProgress?.({ channel, count: 0 });
        continue;
      }

      report.push({ channel, count: result.sections });
      await onProgress?.({ channel, count: result.sections });
    } catch (error) {
      report.push({ channel, count: 0 });
      await onProgress?.({ channel, count: 0 });
      console.error(`[sendCityRateMessage] Failed for city ${city.en_name}:`, error);
    }
  }

  return { report };
};
