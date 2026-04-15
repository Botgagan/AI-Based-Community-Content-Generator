import { Request, Response } from "express";
import type { SessionRequest } from "supertokens-node/framework/express";

import {
  getPosts,
  updatePost,
  deletePost,
  generatePostsFromTheme,
  regeneratePost,
  reviewPost,
  schedulePostForFacebook,
  getFacebookPostSchedules,
  markFacebookScheduleShared,
} from "../services/posts.service.js";

import { getPrimaryUserId } from "../utils/getPrimaryUserId.js";
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
  resolveLimit,
  resolvePage,
} from "../config/pagination.js";

/* =============================
   GET POSTS
============================= */

export async function getPostsController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);

    const { themeId, communityId, status, page, limit } = req.query;// Optional filters

    const statuses =
      typeof status === "string"
        ? status
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
        : undefined;

    const posts = await getPosts({
      userId,
      themeId: themeId as string | undefined,
      communityId: communityId as string | undefined,
      statuses,
      page: resolvePage(page, PAGINATION_DEFAULT_PAGE),
      limit: resolveLimit(limit, { fallback: PAGINATION_DEFAULT_LIMIT }),
    });

    res.json({
      success: true,
      posts,
    });
  } catch (err: any) {
    console.error("get posts error:", err);
    res.status(400).json({ message: err.message });
  }
}

/* =============================
   Generate POST
============================= */

export async function generatePostsController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);
    const { themeId } = req.body;

    if (!themeId) {
      return res.status(400).json({
        message: "themeId is required",
      });
    }

    const posts = await generatePostsFromTheme(themeId, userId);

    res.json({
      success: true,
      posts,
    });
  } catch (err: any) {
    console.error("generate posts error:", err);
    res.status(400).json({ message: err.message });
  }
}

/* =============================
   UPDATE POST
============================= */

export async function updatePostController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);

    const { id } = req.params;

    const updated = await updatePost(id, req.body, userId);

    res.json({
      success: true,
      post: updated[0],
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

/* =============================
   DELETE POST
============================= */

export async function deletePostController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);

    const { id } = req.params;

    await deletePost(id, userId);

    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

/* =============================
   REGENERATE POST
============================= */

export async function regeneratePostController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);

    const { id } = req.params;

    const post = await regeneratePost(id, userId);

    res.json({
      success: true,
      post,
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

/* =============================
   REVIEW POST (OWNER)
============================= */

export async function reviewPostController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!id || !status) {
      return res.status(400).json({ message: "post id and status are required" });
    }

    if (status !== "approved" && status !== "rejected") {
      return res.status(400).json({ message: "status must be approved or rejected" });
    }

    const post = await reviewPost(id, status, rejectionReason, userId);

    res.json({
      success: true,
      post,
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

/* =============================
   SCHEDULE POST TO FACEBOOK
============================= */

export async function schedulePostForFacebookController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);
    const { id } = req.params;
    const { scheduledAt, userTimezone } = req.body as {
      scheduledAt?: string;
      userTimezone?: string;
    };

    if (!id || !scheduledAt) {
      return res.status(400).json({ message: "post id and scheduledAt are required" });
    }

    const schedule = await schedulePostForFacebook(
      id,
      scheduledAt,
      userTimezone || "UTC",
      userId
    );

    res.json({
      success: true,
      schedule,
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

/* =============================
   GET FACEBOOK SCHEDULES
============================= */

export async function getFacebookPostSchedulesController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);
    const { communityId } = req.query as { communityId?: string };
    const schedules = await getFacebookPostSchedules(userId, communityId);

    res.json({
      success: true,
      schedules,
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

/* =============================
   MARK SCHEDULE AS SHARED
============================= */

export async function markFacebookScheduleSharedController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);
    const { scheduleId } = req.params;

    if (!scheduleId) {
      return res.status(400).json({ message: "scheduleId is required" });
    }

    const schedule = await markFacebookScheduleShared(scheduleId, userId);
    res.json({
      success: true,
      schedule,
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}
