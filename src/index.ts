import "dotenv/config";
import Fastify from "fastify";
import { Bot } from "grammy";
import admins from "../admins.json" with { type: "json" };
import channels from "../channels.json" with { type: "json" };

type ChannelsMap = Record<string, string>;

const botToken = process.env.BOT_TOKEN;
const port = Number(process.env.PORT ?? 3000);

if (!botToken) {
  throw new Error("BOT_TOKEN is required in environment variables");
}

const allowedAdmins = new Set(
  (admins as string[]).map((username) => username.replace(/^@/, "").toLowerCase())
);

const bot = new Bot(botToken);

bot.command("info", async (ctx) => {
  const links = Object.values(channels as ChannelsMap).map((value) => `t.me/${value}`);
  await ctx.reply(links.join("\n") || "Список каналов пуст");
});

bot.command("post", async (ctx) => {
  const username = ctx.from?.username?.toLowerCase();

  if (!username || !allowedAdmins.has(username)) {
    await ctx.reply("Команда доступна только для админов p2pie");
    return;
  }

  const results = await Promise.allSettled(
    Object.entries(channels as ChannelsMap).map(async ([key, value]) => {
      await bot.api.sendMessage(`@${value}`, `Курсы в городе ${key}`);
      return value;
    })
  );

  const successCount = results.filter((result) => result.status === "fulfilled").length;
  const failCount = results.length - successCount;

  await ctx.reply(`Готово. Отправлено: ${successCount}, ошибок: ${failCount}`);
});

const app = Fastify({ logger: true });

app.get("/health", async () => ({ ok: true }));

const start = async () => {
  await app.listen({ port, host: "0.0.0.0" });
  app.log.info(`HTTP server listening on port ${port}`);

  await bot.start({
    onStart: (botInfo) => {
      app.log.info(`Bot started as @${botInfo.username}`);
    }
  });
};

start().catch((error) => {
  app.log.error(error);
  process.exit(1);
});
