import { Router } from "express";
import { verifySession } from "../middleware/auth.js";

import {
  createCommunityController,
  getCommunitiesController,
  updateCommunityController,
  deleteCommunityController,
  getCommunityByIdController,
  leaveCommunityController,
  joinCommunityController,
  getCommunityAdminStatsController,
} from "../controllers/community.controllers.js";

const router = Router();

router.post("/create",verifySession(), createCommunityController);
router.get("/list",verifySession(), getCommunitiesController);
router.get("/:id/admin-stats", verifySession(), getCommunityAdminStatsController);
router.get("/:id", verifySession(), getCommunityByIdController);
router.post("/:id/join", verifySession(), joinCommunityController);
router.put("/:id", verifySession(), updateCommunityController);
router.delete("/:id", verifySession(), deleteCommunityController);
router.delete("/:id/leave", verifySession(), leaveCommunityController);

export default router;

