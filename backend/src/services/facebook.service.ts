type FacebookScheduleResult = {
  id?: string;
  post_id?: string;
};

type FacebookPublishStatusResult = {
  is_published?: boolean;
};

function getFacebookConfig() {
  const pageId = process.env.FB_PAGE_ID || process.env.FACEBOOK_PAGE_ID;
  const pageAccessToken =
    process.env.FB_PAGE_ACCESS_TOKEN || process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!pageId || !pageAccessToken) {
    throw new Error(
      "Facebook is not configured. Set FB_PAGE_ID and FB_PAGE_ACCESS_TOKEN in backend env."
    );
  }

  return { pageId, pageAccessToken };
}

export async function scheduleFacebookPhotoPost({
  caption,
  imageUrl,
  scheduledAt,
}: {
  caption: string;
  imageUrl: string;
  scheduledAt: Date;
}): Promise<FacebookScheduleResult> {
  const { pageId, pageAccessToken } = getFacebookConfig();

  const nowSec = Math.floor(Date.now() / 1000);
  const scheduledSec = Math.floor(scheduledAt.getTime() / 1000);
  const minScheduleSec = nowSec + 10 * 60;
  const maxScheduleSec = nowSec + 75 * 24 * 60 * 60;

  if (scheduledSec < minScheduleSec) {
    throw new Error("Facebook requires scheduling at least 10 minutes in the future.");
  }

  if (scheduledSec > maxScheduleSec) {
    throw new Error("Facebook allows scheduling only up to 75 days in advance.");
  }

  const body = new URLSearchParams();
  body.set("caption", caption);
  body.set("url", imageUrl);
  body.set("published", "false");
  body.set("scheduled_publish_time", String(scheduledSec));
  body.set("access_token", pageAccessToken);

  const response = await fetch(`https://graph.facebook.com/v23.0/${pageId}/photos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = (await response.json()) as
    | FacebookScheduleResult
    | { error?: { message?: string; code?: number; type?: string } };

  if (!response.ok || ("error" in data && data.error)) {
    const message =
      ("error" in data && data.error?.message) ||
      "Facebook scheduling failed";
    throw new Error(message);
  }

  return data as FacebookScheduleResult;
}

export async function getFacebookPublishStatus(
  facebookObjectId: string
): Promise<"published" | "scheduled"> {
  const { pageAccessToken } = getFacebookConfig();

  const params = new URLSearchParams();
  params.set("fields", "is_published");
  params.set("access_token", pageAccessToken);

  const response = await fetch(
    `https://graph.facebook.com/v23.0/${facebookObjectId}?${params.toString()}`,
    { method: "GET" }
  );

  const data = (await response.json()) as
    | FacebookPublishStatusResult
    | { error?: { message?: string } };

  if (!response.ok || ("error" in data && data.error)) {
    return "scheduled";
  }

  return data.is_published ? "published" : "scheduled";
}
