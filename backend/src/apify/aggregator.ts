import { scrapeWebsite } from "./website.scraper";
import { scrapeYouTube } from "./youtube.scraper";
import { scrapeTwitter } from "./twitter.scraper";
import { formatScrapedData } from "./formatter";

const SCRAPER_TIMEOUT_MS = Number(process.env.APIFY_SCRAPER_TIMEOUT_MS);
const ENABLE_SCRAPER_DEBUG_LOGS = process.env.ENABLE_SCRAPER_DEBUG_LOGS !== "false";

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
    console.error("Website aggregation failed:", websiteRes.reason);
  }
  if (youtubeRes.status === "rejected") {
    console.error("YouTube aggregation failed:", youtubeRes.reason);
  }
  if (twitterRes.status === "rejected") {
    console.error("Twitter aggregation failed:", twitterRes.reason);
  }

  const website = websiteRes.status === "fulfilled" ? websiteRes.value : [];
  const youtube = youtubeRes.status === "fulfilled" ? youtubeRes.value : [];
  const twitter = twitterRes.status === "fulfilled" ? twitterRes.value : [];

  if (ENABLE_SCRAPER_DEBUG_LOGS) {
    console.info("[apify.aggregate] website items:", website.length);
    console.dir(website, { depth: 3, maxArrayLength: 20 });

    console.info("[apify.aggregate] youtube items:", youtube.length);
    console.dir(youtube, { depth: 3, maxArrayLength: 20 });

    console.info("[apify.aggregate] twitter items:", twitter.length);
    console.dir(twitter, { depth: 3, maxArrayLength: 20 });
  }

  if (website.length === 0 && youtube.length === 0 && twitter.length === 0) {
    console.warn("All scrapers returned empty content, continuing with fallback prompt input.");
  }

  const aggregatedContent = formatScrapedData({ website, youtube, twitter });

  if (ENABLE_SCRAPER_DEBUG_LOGS) {
    console.info("[apify.aggregate] content passed to LLM:");
    console.log(aggregatedContent);
  }

  return aggregatedContent;
}
