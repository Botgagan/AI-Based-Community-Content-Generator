import { Request, Response } from "express";
import type { SessionRequest } from "supertokens-node/framework/express";

import {
  getPosts,
  createPost,
  updatePost,
  deletePost,
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
   CREATE POST
============================= */

export async function createPostController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);

    const { themeId, title, content } = req.body;

    if (!themeId || !title || !content) {
      return res.status(400).json({
        message: "Missing fields",
      });
    }

    const post = await createPost(
      {
        themeId,
        title,
        content,
      },
      userId
    );

    res.status(201).json({
      success: true,
      post,
    });
  } catch (err: any) {
    console.error("create post error:", err);
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