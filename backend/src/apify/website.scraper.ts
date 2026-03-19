import { apifyClient } from "./apify.client";

const WEBSITE_ACTOR_ID = process.env.APIFY_WEBSITE_ACTOR_ID;

const WEBSITE_MAX_PAGES = Number(process.env.APIFY_WEBSITE_MAX_PAGES);
const WEBSITE_MAX_ITEMS = Number(process.env.APIFY_WEBSITE_MAX_ITEMS);

export async function scrapeWebsite(url: string) {
  if (!url) return [];

  try {
    const run = await apifyClient.actor(WEBSITE_ACTOR_ID).call({
      startUrls: [{ url }],
      maxPagesPerCrawl: WEBSITE_MAX_PAGES,
      maxCrawlPages: WEBSITE_MAX_PAGES,
      maxRequestsPerCrawl: WEBSITE_MAX_PAGES,
      maxDepth: 0, // Only the homepage
      sameDomain: true,
      maxConcurrency: 1,
    });

    if (!run.defaultDatasetId) return [];

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems({
      limit: WEBSITE_MAX_ITEMS,
    });

    return items.slice(0, WEBSITE_MAX_ITEMS);
  } catch (error) {
    console.error("Website scrape failed:", error);
    return [];
  }
}
