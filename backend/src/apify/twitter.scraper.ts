import { apifyClient } from "./apify.client";

const DEFAULT_TWITTER_ACTOR_ID = "apidojo/tweet-scraper";
const TWITTER_ACTOR_ID = process.env.APIFY_TWITTER_ACTOR_ID || DEFAULT_TWITTER_ACTOR_ID;
const TWITTER_MAX_ITEMS = Number(process.env.APIFY_TWITTER_MAX_ITEMS);

function isNotFoundError(error: unknown): boolean {
  const e = error as { statusCode?: number; type?: string };
  return e?.statusCode === 404 || e?.type === "record-not-found";
}

async function runTwitterActor(actorId: string, url: string) {
  return apifyClient.actor(actorId).call({
    startUrls: [{ url }],
    maxTweets: TWITTER_MAX_ITEMS,
    maxItems: TWITTER_MAX_ITEMS,
    resultsLimit: TWITTER_MAX_ITEMS,
  });
}

export async function scrapeTwitter(url: string) {
  if (!url) return [];

  try {
    let run;

    try {
      run = await runTwitterActor(TWITTER_ACTOR_ID, url);
    } catch (error) {
      if (!isNotFoundError(error) || TWITTER_ACTOR_ID === DEFAULT_TWITTER_ACTOR_ID) {
        throw error;
      }

      console.warn(
        `Twitter actor '${TWITTER_ACTOR_ID}' not found. Falling back to '${DEFAULT_TWITTER_ACTOR_ID}'.`
      );
      run = await runTwitterActor(DEFAULT_TWITTER_ACTOR_ID, url);
    }

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
