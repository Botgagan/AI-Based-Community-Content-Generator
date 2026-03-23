import { Request, Response } from "express";
import type { SessionRequest } from "supertokens-node/framework/express";

import {
  getPosts,
  updatePost,
  deletePost,
  generatePostsFromTheme,
  regeneratePost,
} from "../services/posts.service.js";

import { getPrimaryUserId } from "../utils/getPrimaryUserId.js";

/* =============================
   GET POSTS
============================= */

export async function getPostsController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);

    const { themeId, communityId, page } = req.query;// Optional filters

    const posts = await getPosts({
      userId,
      themeId: themeId as string | undefined,
      communityId: communityId as string | undefined,
      page: Number(page) || 1,
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