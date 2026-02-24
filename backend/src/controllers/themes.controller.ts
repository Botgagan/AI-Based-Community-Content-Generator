import { Request, Response } from "express";
import type { SessionRequest } from "supertokens-node/framework/express";

import {
  generateThemes,
  createCustomTheme,
  getThemesByCommunity,
  deleteTheme,
} from "../services/themes.service.js";

/* =======================================================
   GENERATE THEMES
======================================================= */

export async function generateThemesController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = req.session!.getUserId();
    const { communityId } = req.body;

    const themes = await generateThemes(communityId, userId);

    res.status(201).json({
      success: true,
      themes,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
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
    const userId = req.session!.getUserId();
    const { communityId, title, description } = req.body;

    const theme = await createCustomTheme(
      { communityId, title, description },
      userId
    );

    res.status(201).json({
      success: true,
      theme,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
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
    const userId = req.session!.getUserId();
    const { communityId } = req.params;

    const themes = await getThemesByCommunity(communityId, userId);

    res.json({ success: true, themes });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
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
    const userId = req.session!.getUserId();
    const { id } = req.params;

    await deleteTheme(id, userId);

    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}