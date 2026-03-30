import { scrapeWebsite } from "./website.scraper";
import { scrapeYouTube } from "./youtube.scraper";
import { scrapeTwitter } from "./twitter.scraper";
import { formatScrapedData } from "./formatter";

const rawScraperTimeout = Number(process.env.APIFY_SCRAPER_TIMEOUT_MS);
const SCRAPER_TIMEOUT_MS =
  Number.isFinite(rawScraperTimeout) && rawScraperTimeout > 0
    ? rawScraperTimeout
    : 60000;
const ENABLE_SCRAPER_DEBUG_LOGS = process.env.ENABLE_SCRAPER_DEBUG_LOGS !== "false";
const SCRAPER_PREVIEW_ITEMS = Number(process.env.SCRAPER_PREVIEW_ITEMS || 5);
const SCRAPER_PREVIEW_TEXT_LENGTH = Number(process.env.SCRAPER_PREVIEW_TEXT_LENGTH || 120);

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}

function truncate(value: unknown, max = SCRAPER_PREVIEW_TEXT_LENGTH): string {
  const text = typeof value === "string" ? value : String(value ?? "");
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function getItemPreview(item: Record<string, unknown>) {
  return {
    title: truncate(item.title),
    text: truncate(item.text ?? item.fullText ?? item.full_text ?? item.description),
    noResults: Boolean(item.noResults),
    url: truncate(item.url),
  };
}

function hasMeaningfulContent(item: unknown): boolean {
  if (!item || typeof item !== "object") return false;
  const record = item as Record<string, unknown>;
  if (record.noResults === true) return false;

  const candidates = [
    record.title,
    record.text,
    record.fullText,
    record.full_text,
    record.description,
    record.markdown,
    record.content,
    record.url,
  ];

  return candidates.some((value) => typeof value === "string" && value.trim().length > 0);
}

function sanitizeItems(items: unknown[]): Record<string, unknown>[] {
  return items.filter(hasMeaningfulContent) as Record<string, unknown>[];
}

function logScraperPreview(label: string, items: any[]) {
  console.info(`[apify.aggregate] ${label} items: ${items.length}`);
  const preview = items
    .slice(0, SCRAPER_PREVIEW_ITEMS)
    .map((item) => getItemPreview((item || {}) as Record<string, unknown>));
  console.dir(preview, { depth: null });
}

async function withTimeout<T>(promise: Promise<T>, label: string, timeoutMs = SCRAPER_TIMEOUT_MS): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function getAggregatedContent({
  websiteUrl,
  youtubeUrl,
  twitterUrl,
}: {
  websiteUrl?: string;
  youtubeUrl?: string;
  twitterUrl?: string;
}) {
  if (ENABLE_SCRAPER_DEBUG_LOGS) {
    console.info("[apify.aggregate] input urls", { websiteUrl, youtubeUrl, twitterUrl });
  }

  const [websiteRes, youtubeRes, twitterRes] = await Promise.allSettled([
    withTimeout(scrapeWebsite(websiteUrl || ""), "Website scraper"),
    withTimeout(scrapeYouTube(youtubeUrl || ""), "YouTube scraper"),
    withTimeout(scrapeTwitter(twitterUrl || ""), "Twitter scraper"),
  ]);

  if (websiteRes.status === "rejected") {
    console.error(`[apify.aggregate] Website scraper failed: ${getErrorMessage(websiteRes.reason)}`);
  }
  if (youtubeRes.status === "rejected") {
    console.error(`[apify.aggregate] YouTube scraper failed: ${getErrorMessage(youtubeRes.reason)}`);
  }
  if (twitterRes.status === "rejected") {
    console.error(`[apify.aggregate] Twitter scraper failed: ${getErrorMessage(twitterRes.reason)}`);
  }

  const websiteRaw = websiteRes.status === "fulfilled" ? websiteRes.value : [];
  const youtubeRaw = youtubeRes.status === "fulfilled" ? youtubeRes.value : [];
  const twitterRaw = twitterRes.status === "fulfilled" ? twitterRes.value : [];
  const website = sanitizeItems(websiteRaw);
  const youtube = sanitizeItems(youtubeRaw);
  const twitter = sanitizeItems(twitterRaw);

  if (ENABLE_SCRAPER_DEBUG_LOGS) {
    logScraperPreview("website", website);
    logScraperPreview("youtube", youtube);
    logScraperPreview("twitter", twitter);
  }

  if (website.length === 0 && youtube.length === 0 && twitter.length === 0) {
    console.warn("All scrapers returned empty content, continuing with fallback prompt input.");
  }

  const aggregatedContent = formatScrapedData({ website, youtube, twitter });

  if (ENABLE_SCRAPER_DEBUG_LOGS) {
    console.info("[apify.aggregate] content passed to LLM (preview):");
    console.log(truncate(aggregatedContent, 600));
  }

  return aggregatedContent;
}
