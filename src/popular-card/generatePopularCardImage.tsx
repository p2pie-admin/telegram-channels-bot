import { ChakraProvider } from "@chakra-ui/react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { constructStyleTagsFromChunks, extractCriticalToChunks } from "@emotion/server";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { renderToString } from "react-dom/server";
import frontTheme from "../front-theme/index.js";
import type { PopularBanksSection } from "../loadPopularBanksText.js";
import type { City } from "../types/city.js";
import { PopularRatesCard } from "./PopularRatesCard.js";

const renderHtml = (sections: PopularBanksSection[], city?: City | null) => {
  const cache = createCache({ key: "chakra" });
  const app = (
    <CacheProvider value={cache}>
      <ChakraProvider theme={frontTheme}>
        <PopularRatesCard sections={sections} city={city} generatedAt={new Date().toISOString()} />
      </ChakraProvider>
    </CacheProvider>
  );

  const markup = renderToString(app);
  const chunks = extractCriticalToChunks(markup);
  const styles = constructStyleTagsFromChunks(chunks);

  return `<!doctype html><html><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />${styles}<style>body{margin:0;background:#242323;}#root{padding:8px;width:fit-content;background:#242323;}</style></head><body><div id="root">${markup}</div></body></html>`;
};

export const generatePopularCardImage = async (
  sections: PopularBanksSection[],
  city?: City | null,
): Promise<string> => {
  const browser = await chromium.launch({ headless: true });
  try {
    const rows = Math.max(1, Math.ceil(sections.length / 2));
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 820, height: Math.max(260, rows * 190 + 80) },
    });
    const page = await context.newPage();
    await page.setContent(renderHtml(sections, city), { waitUntil: "networkidle" });

    const outputDir = path.resolve(process.cwd(), "generated");
    await mkdir(outputDir, { recursive: true });
    const outputPath = path.join(
      outputDir,
      `popular-card-${(city?.en_name || "all").toLowerCase()}-${Date.now()}.png`,
    );
    await page.locator("#root").screenshot({ path: outputPath });
    return outputPath;
  } finally {
    await browser.close();
  }
};
