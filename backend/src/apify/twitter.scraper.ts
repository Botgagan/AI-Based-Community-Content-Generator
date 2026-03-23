import { apifyClient } from "./apify.client";

const TWITTER_ACTOR_ID = process.env.APIFY_TWITTER_ACTOR_ID?.trim();
const TWITTER_MAX_ITEMS = Number(process.env.APIFY_TWITTER_MAX_ITEMS);

function isTwitterUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === "x.com" || hostname.endsWith(".x.com") || hostname.endsWith("twitter.com");
  } catch {
    return false;
  }
}

export async function scrapeTwitter(url: string) {
  if (!url) return [];
  if (!TWITTER_ACTOR_ID) {
    console.warn("Twitter scrape skipped: APIFY_TWITTER_ACTOR_ID is not configured.");
    return [];
  }
  if (!isTwitterUrl(url)) {
    console.warn(`Twitter scrape skipped: URL is not an X/Twitter URL (${url}).`);
    return [];
  }

  try {
    const run = await apifyClient.actor(TWITTER_ACTOR_ID).call({
      startUrls: [{ url }],
      maxTweets: TWITTER_MAX_ITEMS,
      maxItems: TWITTER_MAX_ITEMS,
      resultsLimit: TWITTER_MAX_ITEMS,
    });

    if (!run.defaultDatasetId) return [];

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems({
      limit: TWITTER_MAX_ITEMS,
    });

    return items.slice(0, TWITTER_MAX_ITEMS);
  } catch (error) {
    console.error("Twitter scrape failed:", error);
    return [];
  }
}
