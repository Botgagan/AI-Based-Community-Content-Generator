import { Router } from "express";
import { verifySession } from "../middleware/auth.js";

import {
  generateThemesController,
  createCustomThemeController,
  getThemesController,
  deleteThemeController,
  updateThemeStatusController,
  updateThemeController,
  getThemeDetailController,
} from "../controllers/themes.controller.js";

const router = Router();

router.post("/generate", verifySession(), generateThemesController);
router.post("/custom", verifySession(), createCustomThemeController);
router.get("/", verifySession(), getThemesController);
router.get("/:id/detail", verifySession(), getThemeDetailController);
router.patch("/:id/status", verifySession(), updateThemeStatusController);
router.put("/:id", verifySession(), updateThemeController);
router.delete("/:id", verifySession(), deleteThemeController);

export default router;
