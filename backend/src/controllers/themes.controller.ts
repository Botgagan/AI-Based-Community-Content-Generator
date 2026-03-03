import { Request, Response } from "express";
import type { SessionRequest } from "supertokens-node/framework/express";

import {
  generateThemes,
  createCustomTheme,
  getThemesByCommunity,
  deleteTheme,
} from "../services/themes.service.js";

import { getPrimaryUserId } from "../utils/getPrimaryUserId.js";

/* =======================================================
   GENERATE THEMES
======================================================= */

export async function generateThemesController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);
    const { communityId } = req.body;

    if (!communityId) {
      return res.status(400).json({ message: "communityId required" });
    }

    const themes = await generateThemes(communityId, userId);

    res.status(201).json({
      success: true,
      themes,
    });
  } catch (err: any) {
    console.error("generate themes error:", err);
    res.status(403).json({ message: err.message });
  }
}

/* =======================================================
   CREATE CUSTOM THEME
======================================================= */

export async function createCustomThemeController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);
    const { communityId, title, description } = req.body;

    if (!communityId || !title) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const theme = await createCustomTheme(
      { communityId, title, description },
      userId
    );

    res.status(201).json({
      success: true,
      theme,
    });
  } catch (err: any) {
    console.error("create theme error:", err);
    res.status(403).json({ message: err.message });
  }
}

/* =======================================================
   GET THEMES
======================================================= */

export async function getThemesController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);
    const { communityId } = req.params;

    if (!communityId) {
      return res.status(400).json({ message: "communityId required" });
    }

    const themes = await getThemesByCommunity(communityId, userId);

    res.json({ success: true, themes });
  } catch (err: any) {
    console.error("get themes error:", err);
    res.status(403).json({ message: err.message });
  }
}

/* =======================================================
   DELETE THEME
======================================================= */

export async function deleteThemeController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Theme id required" });
    }

    await deleteTheme(id, userId);

    res.json({ success: true });
  } catch (err: any) {
    console.error("delete theme error:", err);
    res.status(403).json({ message: err.message });
  }
}