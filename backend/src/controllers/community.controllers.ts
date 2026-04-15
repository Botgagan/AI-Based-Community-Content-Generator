import { Request, Response } from "express";
import type { SessionRequest } from "supertokens-node/framework/express";
import { randomUUID } from "crypto";

import {
  createCommunity,
  getUserCommunities,
  getCommunityById,
  updateCommunity,
  deleteCommunity,
  leaveCommunity,
  joinCommunity,
  getCommunityAdminStats,
} from "../services/community.service.js";

import { getPrimaryUserId } from "../utils/getPrimaryUserId.js";
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
  resolveLimit,
  resolvePage,
} from "../config/pagination.js";

/* CREATE */
export async function createCommunityController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);

    const { name, description, websiteUrl, youtubeUrl, twitterUrl, imageUrl } = req.body;

    const community = await createCommunity(
      {
        id: randomUUID(),
        name,
        description,
        websiteUrl,
        youtubeUrl,
        twitterUrl,
        imageUrl,
      },
      userId
    );

    res.status(201).json({ success: true, community });
  } catch (err: any) {
    console.error("create error :", err);
    res.status(500).json({ message: err.message });
  }
}

/* LIST */
export async function getCommunitiesController(
  req: Request & SessionRequest,
  res: Response
) {
  try {

    const userId = await getPrimaryUserId(req);

    const { page, limit, all } = req.query;
    const scope = req.query.scope === "directory" ? "directory" : "member";

    const communities = await getUserCommunities({
      userId,
      page: resolvePage(page, PAGINATION_DEFAULT_PAGE),
      limit: resolveLimit(limit, { fallback: PAGINATION_DEFAULT_LIMIT }),
      all: all === "true",
      scope,
    });

    res.json({
      success: true,
      communities,
    });

  } catch (err: any) {
    console.error("COMMUNITY LIST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
}

/* JOIN */
export async function joinCommunityController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);
    const { id } = req.params;

    const result = await joinCommunity(id, userId);

    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("join error :", err);
    res.status(400).json({ message: err.message });
  }
}

/* GET BY ID */
export async function getCommunityByIdController(req: Request & SessionRequest, res: Response) {
  try {
    const userId = await getPrimaryUserId(req);
    const { id } = req.params;

    const community = await getCommunityById(id, userId);

    if (!community)
      return res.status(403).json({
        message: "You are not member of this community",
      });

    res.json({ success: true, community });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

/* UPDATE */
export async function updateCommunityController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);
    const { id } = req.params;

    const updated = await updateCommunity(id, userId, req.body);

    res.json({ success: true, community: updated[0] });
  } catch (err: any) {
    res.status(403).json({ message: err.message });
  }
}

/* DELETE */
export async function deleteCommunityController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);
    const { id } = req.params;

    const deleted = await deleteCommunity(id, userId);

    res.json({ success: true, deleted });
  } catch (err: any) {
    res.status(403).json({ message: err.message });
  }
}

/* LEAVE */
export async function leaveCommunityController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);
    const { id } = req.params;

    await leaveCommunity(id, userId);

    res.json({ success: true });
  } catch (err: any) {
    res.status(403).json({ message: err.message });
  }
}

/* ADMIN STATS */
export async function getCommunityAdminStatsController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);
    const { id } = req.params;

    const stats = await getCommunityAdminStats(id, userId);
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(403).json({ message: err.message });
  }
}


