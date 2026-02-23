import { ChakraProvider } from "@chakra-ui/react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { extractCriticalToChunks, constructStyleTagsFromChunks } from "@emotion/server";
import { chromium } from "playwright";
import { renderToString } from "react-dom/server";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import frontTheme from "../front-theme/index.js";
import { SendCityRateReportCard, type ReportRow } from "./SendCityRateReportCard.js";

export type ReportImagePayload = {
  cityTitle: string;
  subtitle: string;
  rows: ReportRow[];
};

const renderCardHtml = (payload: ReportImagePayload) => {
  const cache = createCache({ key: "chakra" });

  const app = (
    <CacheProvider value={cache}>
      <ChakraProvider theme={frontTheme}>
        <SendCityRateReportCard
          title={payload.cityTitle}
          subtitle={payload.subtitle}
          generatedAt={new Date().toISOString()}
          rows={payload.rows}
        />
      </ChakraProvider>
    </CacheProvider>
  );

  const markup = renderToString(app);
  const chunks = extractCriticalToChunks(markup);
  const styleTags = constructStyleTagsFromChunks(chunks);

  return `<!doctype html><html><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />${styleTags}<style>body{margin:0;background:#050A12;}#root{padding:24px;width:fit-content;}</style></head><body><div id="root">${markup}</div></body></html>`;
};

export const generateReportCardImage = async (
  payload: ReportImagePayload,
): Promise<string> => {
  const html = renderCardHtml(payload);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 700, height: 1200 } });
    await page.setContent(html, { waitUntil: "networkidle" });

    const card = page.locator("#root").first();
    const outputDir = path.resolve(process.cwd(), "generated");
    await mkdir(outputDir, { recursive: true });

    const stamp = Date.now();
    const safeCity = payload.cityTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const outputPath = path.join(outputDir, `send-city-rate-${safeCity}-${stamp}.png`);
    await card.screenshot({ path: outputPath });

    return outputPath;
  } finally {
    await browser.close();
  }
};
