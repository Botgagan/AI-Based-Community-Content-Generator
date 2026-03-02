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
} from "../services/community.service";

import { getPrimaryUserId } from "../utils/getPrimaryUserId.js";

/* CREATE */
export async function createCommunityController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);

    const { name, description, websiteUrl, youtubeUrl, twitterUrl } = req.body;

    const community = await createCommunity(
      {
        id: randomUUID(),
        name,
        description,
        websiteUrl,
        youtubeUrl,
        twitterUrl,
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
    const data = await getUserCommunities(userId);
    res.json({ success: true, communities: data });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

/* GET BY ID */
export async function getCommunityByIdController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);
    const { id } = req.params;

    const community = await getCommunityById(id, userId);

    if (!community)
      return res.status(404).json({ message: "Community not found" });

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


