import { Request, Response } from "express";
import SessionRequest from "supertokens-node/framework/express";
import { createCommunity, getUserCommunities, updateCommunity, deleteCommunity } from "../services/community.service.js";
import { randomUUID } from "crypto";

export async function createCommunityController(req: Request & SessionRequest, res: Response) {
  try {
    const userId = req.session.getUserId();

    const { name, description, websiteUrl, youtubeUrl, twitterUrl } = req.body;

    const community = await createCommunity({
      id: randomUUID(),
      userId,
      name,
      description,
      websiteUrl,
      youtubeUrl,
      twitterUrl,
    });

    res.status(201).json({
      success: true,
      community,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create community" });
  }
}

export async function getCommunitiesController(req: Request & SessionRequest, res: Response) {
  try {
    const userId = req.session.getUserId();

    const data = await getUserCommunities(userId);

    res.status(200).json({
      success: true,
      communities: data,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch communities" });
  }
}

export async function updateCommunityController(req: Request & SessionRequest, res: Response) {
  try {
    const userId = req.session.getUserId();
    const { id } = req.params;

    const updated = await updateCommunity(id, userId, req.body);

    if (!updated.length)//if no community is updated then it means either community with given id doesn't exist or it doesn't belong to user.
      return res.status(404).json({ message: "Community not found" });

    res.json({
      success: true,
      community: updated[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
}

export async function deleteCommunityController(req: Request & SessionRequest, res: Response) {
  try {
    const userId = req.session.getUserId();
    const { id } = req.params;

    const deleted = await deleteCommunity(id, userId);

    if (!deleted.length)//if no community is deleted then it means either community with given id doesn't exist or it doesn't belong to user.
      return res.status(404).json({ message: "Community not found" });

    res.json({
      success: true,
      message: "Community deleted"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
}


