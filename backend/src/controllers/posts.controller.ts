import { Request, Response } from "express";
import type { SessionRequest } from "supertokens-node/framework/express";

import {
  getPosts,
  updatePost,
  deletePost,
  generatePostsFromTheme,
  regeneratePost,
  reviewPost,
  scheduleApprovedPostToFacebook,
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

export async function schedulePostToFacebookController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);
    const { id } = req.params;
    const { scheduledAt, timezone } = req.body as { scheduledAt?: string; timezone?: string };

    if (!id || !scheduledAt) {
      return res.status(400).json({ message: "post id and scheduledAt are required" });
    }

    const parsed = new Date(scheduledAt);
    if (Number.isNaN(parsed.getTime())) {
      return res.status(400).json({ message: "Invalid scheduledAt datetime" });
    }

    const result = await scheduleApprovedPostToFacebook(id, parsed, userId, timezone || "UTC");

    res.json({
      success: true,
      schedule: result,
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}
