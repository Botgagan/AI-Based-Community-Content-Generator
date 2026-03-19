import { apifyClient } from "./apify.client";

const DEFAULT_YOUTUBE_ACTOR_ID = "streamers/youtube-scraper";
const YOUTUBE_ACTOR_ID = process.env.APIFY_YOUTUBE_ACTOR_ID || DEFAULT_YOUTUBE_ACTOR_ID;
const YOUTUBE_MAX_ITEMS = Number(process.env.APIFY_YOUTUBE_MAX_ITEMS);

function isNotFoundError(error: unknown): boolean {
  const e = error as { statusCode?: number; type?: string };
  return e?.statusCode === 404 || e?.type === "record-not-found";
}

async function runYoutubeActor(actorId: string, url: string) {
  return apifyClient.actor(actorId).call({
    startUrls: [{ url }],
    maxResults: YOUTUBE_MAX_ITEMS,
    maxItems: YOUTUBE_MAX_ITEMS,
  });
}

export async function scrapeYouTube(url: string) {
  if (!url) return [];

  try {
    let run;

    try {
      run = await runYoutubeActor(YOUTUBE_ACTOR_ID, url);
    } catch (error) {
      if (!isNotFoundError(error) || YOUTUBE_ACTOR_ID === DEFAULT_YOUTUBE_ACTOR_ID) {
        throw error;
      }

      console.warn(
        `YouTube actor '${YOUTUBE_ACTOR_ID}' not found. Falling back to '${DEFAULT_YOUTUBE_ACTOR_ID}'.`
      );
      run = await runYoutubeActor(DEFAULT_YOUTUBE_ACTOR_ID, url);
    }

    if (!run.defaultDatasetId) return [];

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems({
      limit: YOUTUBE_MAX_ITEMS,
    });

    return items.slice(0, YOUTUBE_MAX_ITEMS);
  } catch (error) {
    console.error("YouTube scrape failed:", error);
    return [];
  }
}
