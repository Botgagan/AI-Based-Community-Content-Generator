import { Router } from "express";
import { verifySession } from "../middleware/auth.js";

import {
  generateThemesController,
  createCustomThemeController,
  getThemesController,
  deleteThemeController,
} from "../controllers/themes.controller.js";

const router = Router();

router.post("/generate", verifySession(), generateThemesController);
router.post("/custom", verifySession(), createCustomThemeController);
router.get("/:communityId", verifySession(), getThemesController);
router.delete("/:id", verifySession(), deleteThemeController);

export default router;