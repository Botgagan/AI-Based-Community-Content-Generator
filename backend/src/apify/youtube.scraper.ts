import { apifyClient } from "./apify.client";

const YOUTUBE_ACTOR_ID = process.env.APIFY_YOUTUBE_ACTOR_ID?.trim();
const YOUTUBE_MAX_ITEMS = Number(process.env.APIFY_YOUTUBE_MAX_ITEMS);

function isYouTubeUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return (
      hostname === "youtu.be" ||
      hostname.endsWith("youtube.com") ||
      hostname.endsWith("youtube-nocookie.com")
    );
  } catch {
    return false;
  }
}

export async function scrapeYouTube(url: string) {
  if (!url) return [];
  if (!YOUTUBE_ACTOR_ID) {
    console.warn("YouTube scrape skipped: APIFY_YOUTUBE_ACTOR_ID is not configured.");
    return [];
  }
  if (!isYouTubeUrl(url)) {
    console.warn(`YouTube scrape skipped: URL is not a YouTube URL (${url}).`);
    return [];
  }

  try {
    const run = await apifyClient.actor(YOUTUBE_ACTOR_ID).call({
      startUrls: [{ url }],
      maxResults: YOUTUBE_MAX_ITEMS,
      maxItems: YOUTUBE_MAX_ITEMS,
    });

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
