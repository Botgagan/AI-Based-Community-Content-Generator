import { Request, Response } from "express";
import type { SessionRequest } from "supertokens-node/framework/express";

import {
  generateThemes,
  createCustomTheme,
  getThemesByCommunity,
  deleteTheme,
  updateThemeStatus,
  updateTheme,
  getThemeDetail,
} from "../services/themes.service.js";

import { getPrimaryUserId } from "../utils/getPrimaryUserId.js";
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
  resolveLimit,
  resolvePage,
} from "../config/pagination.js";

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

    const { communityId, status } = req.query;

    const page = resolvePage(req.query.page, PAGINATION_DEFAULT_PAGE);
    const limit = resolveLimit(req.query.limit, {
      fallback: PAGINATION_DEFAULT_LIMIT,
    });

    if (!communityId) {
      return res.status(400).json({ message: "communityId required" });
    }

    const statuses =
      typeof status === "string"
        ? status
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean) as ("pending" | "active" | "inactive" | "deleted")[]
        : undefined;

    const themes = await getThemesByCommunity({
      communityId: communityId as string,
      userId,
      page,
      limit,
      statuses,
    });

    res.json({
      success: true,
      themes,
    });

  } catch (err: any) {
    res.status(403).json({ message: err.message });
    console.error("get themes error:", err);
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

export async function updateThemeStatusController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);
    const { id } = req.params;
    const { status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ message: "Theme id and status are required" });
    }

    const theme = await updateThemeStatus(id, status, userId);
    res.json({ success: true, theme });
  } catch (err: any) {
    console.error("update theme status error:", err);
    res.status(403).json({ message: err.message });
  }
}

export async function updateThemeController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);
    const { id } = req.params;
    const { title, description } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Theme id required" });
    }

    const theme = await updateTheme(id, { title, description }, userId);
    res.json({ success: true, theme });
  } catch (err: any) {
    console.error("update theme error:", err);
    res.status(403).json({ message: err.message });
  }
}

export async function getThemeDetailController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Theme id required" });
    }

    const detail = await getThemeDetail(id, userId);
    res.json({ success: true, ...detail });
  } catch (err: any) {
    console.error("get theme detail error:", err);
    res.status(403).json({ message: err.message });
  }
}
