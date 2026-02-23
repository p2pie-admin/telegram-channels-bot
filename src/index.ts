import "dotenv/config";
import Fastify from "fastify";
import { Bot, InlineKeyboard } from "grammy";
import admins from "../admins.json" with { type: "json" };
import { loadCities } from "./loadCities.js";
import { loadPopularBanksText } from "./loadPopularBanksText.js";
import { sendPopularCardsToTarget } from "./popular-card/sendPopularCardsToTarget.js";
import { sendCityRateMessage } from "./sendCityRateMessage.js";

const botToken =
  process.env.TELEGRAM_CHANNELS_BOT_TOKEN || process.env.BOT_TOKEN;
const port = Number(
  process.env.TELEGRAM_CHANNELS_PORT ?? process.env.PORT ?? 3030,
);

if (!botToken) {
  throw new Error(
    "TELEGRAM_CHANNELS_BOT_TOKEN (or BOT_TOKEN) is required in environment variables",
  );
}

const allowedAdmins = new Set(
  (admins as string[]).map((username) =>
    username.replace(/^@/, "").toLowerCase(),
  ),
);

const bot = new Bot(botToken);
bot.catch((err) => {
  console.error("[bot.catch] Unhandled bot error:", err.error);
});

const adminKeyboard = new InlineKeyboard()
  .text("Каналы", "publish_channels")
  .text("Сюда", "publish_here");

const canShowAdminKeyboard = (username?: string | null): boolean =>
  !!username && allowedAdmins.has(username.toLowerCase());

const replyAdminKeyboard = async (
  ctx: { reply: (...args: any[]) => Promise<any>; from?: { username?: string } },
) => {
  if (!canShowAdminKeyboard(ctx.from?.username)) return;
  await ctx.reply("Куда опубликовать курсы?", { reply_markup: adminKeyboard });
};

let channelsAutopublishRunning = false;

const runChannelsAutopublish = async (
  onProgress?: (item: { channel: string; count: number }) => Promise<void> | void,
) => {
  if (channelsAutopublishRunning) {
    console.warn("[channelsAutopublish] Skipped: previous run is still in progress");
    return { skipped: true };
  }

  channelsAutopublishRunning = true;
  try {
    await sendCityRateMessage(bot, onProgress);
    return { skipped: false };
  } finally {
    channelsAutopublishRunning = false;
  }
};

const getMoscowNowParts = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Moscow",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  ) as Record<string, string>;

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
};

const msUntilNextMoscowRun = (now = new Date()): number => {
  const p = getMoscowNowParts(now);
  const currentMinutes = p.hour * 60 + p.minute;
  const targetMinutes = currentMinutes < 8 * 60 ? 8 * 60 : currentMinutes < 20 * 60 ? 20 * 60 : 32 * 60; // next day 08:00
  const deltaMinutes = targetMinutes - currentMinutes;
  const deltaMs =
    deltaMinutes * 60 * 1000 - p.second * 1000 - now.getMilliseconds();
  return Math.max(1000, deltaMs);
};

const scheduleChannelsAutopublish = () => {
  const delay = msUntilNextMoscowRun();
  const nextRunAt = new Date(Date.now() + delay);
  console.log(
    `[channelsAutopublish] Next run scheduled in ${Math.round(delay / 1000)}s at ${nextRunAt.toISOString()} (08:00/20:00 Europe/Moscow)`,
  );

  setTimeout(async () => {
    try {
      const parts = getMoscowNowParts();
      console.log(
        `[channelsAutopublish] Triggered at Moscow time ${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`,
      );
      await runChannelsAutopublish();
    } catch (error) {
      console.error("[channelsAutopublish] Failed:", error);
    } finally {
      scheduleChannelsAutopublish();
    }
  }, delay);
};

bot.command("start", async (ctx) => {
  const username = ctx.from?.username?.toLowerCase();

  if (!username || !allowedAdmins.has(username)) {
    await ctx.reply("Напишите город (например: kazan)");
    return;
  }

  await ctx.reply(
    "Бот распознал тебя как администратора.\nКуда опубликовать курсы?",
    { reply_markup: adminKeyboard },
  );
});

bot.callbackQuery("publish_channels", async (ctx) => {
  const username = ctx.from.username?.toLowerCase();
  if (!username || !allowedAdmins.has(username)) {
    await ctx.answerCallbackQuery({
      text: "Команда доступна только для админов p2pie",
      show_alert: true,
    });
    return;
  }

  await ctx.answerCallbackQuery();
  await ctx.reply("Начинаем автопубликацию таблиц курсов во все каналы... ⏳");

  await runChannelsAutopublish(async (item) => {
    await ctx.reply(`Опубликовано: @${item.channel}`);
  });

  await replyAdminKeyboard(ctx);
});

bot.callbackQuery("publish_here", async (ctx) => {
  const username = ctx.from.username?.toLowerCase();
  if (!username || !allowedAdmins.has(username)) {
    await ctx.answerCallbackQuery({
      text: "Команда доступна только для админов p2pie",
      show_alert: true,
    });
    return;
  }

  await ctx.answerCallbackQuery();
  await ctx.reply("Напишите город (например: kazan)");
});

bot.callbackQuery("publish_banks", async (ctx) => {
  try {
    const username = ctx.from.username?.toLowerCase();
    if (!username || !allowedAdmins.has(username)) {
      await ctx.answerCallbackQuery({
        text: "Команда доступна только для админов p2pie",
        show_alert: true,
      });
      return;
    }

    await ctx.answerCallbackQuery();
    await ctx.reply("Генерирую карточки популярных банковских курсов... ⏳");

    const target = ctx.chat?.id ?? ctx.from.id;
    const result = await sendPopularCardsToTarget(bot, target);
    if (!result.sent) {
      const text = await loadPopularBanksText();
      if (!text) {
        await ctx.reply('Не удалось загрузить данные раздела "Банки"');
        return;
      }

      await ctx.reply(text, {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      });
      return;
    }

    await ctx.reply(`Отправлено карточек: ${result.sections}`);
  } catch (error) {
    console.error("[publish_banks] Failed:", error);
    await ctx.reply('Ошибка при загрузке раздела "Банки". Попробуйте позже.');
  }
});

bot.on("message:text", async (ctx) => {
  try {
    const text = ctx.message.text.trim();
    if (text.startsWith("/")) {
      return;
    }

    const city = text.toLowerCase();
    const cities = await loadCities();
    const cityObj = cities.find((item) => item.en_name.toLowerCase() === city);
    const exists = Boolean(cityObj);

    if (!exists) {
      await ctx.reply("Напишите город (например: kazan)");
      return;
    }

    await ctx.reply(`Генерирую таблицу курсов для ${city}... ⏳`);

    const popularResult = await sendPopularCardsToTarget(
      bot,
      ctx.chat.id,
      city,
      cityObj || null,
    );
    if (popularResult.sent) {
      await replyAdminKeyboard(ctx);
      return;
    }

    const fallbackText = await loadPopularBanksText(city);
    if (fallbackText) {
      await ctx.reply(fallbackText, {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      });
      await replyAdminKeyboard(ctx);
      return;
    }

    await ctx.reply("Для этого города нет доступных таблиц курсов");
    await replyAdminKeyboard(ctx);
  } catch (error) {
    console.error("[message:text] Failed:", error);
    await ctx.reply(
      "Сервис временно недоступен (ошибка сети/CMS). Попробуйте позже.",
    );
  }
});

const app = Fastify({ logger: true });

app.get("/health", async () => ({ ok: true }));

const start = async () => {
  await app.listen({ port, host: "0.0.0.0" });
  app.log.info(`HTTP server listening on port ${port}`);

  await bot.start({
    onStart: (botInfo) => {
      app.log.info(`Bot started as @${botInfo.username}`);
    },
  });

  scheduleChannelsAutopublish();
};

start().catch((error) => {
  app.log.error(error);
  process.exit(1);
});
