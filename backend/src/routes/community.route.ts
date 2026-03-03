import { Router } from "express";
import { verifySession } from "../middleware/auth.js";

import {
  createCommunityController,
  getCommunitiesController,
  updateCommunityController,
  deleteCommunityController,
  getCommunityByIdController,
  leaveCommunityController,
} from "../controllers/community.controllers.js";

const router = Router();

router.use(verifySession());

router.post("/create", createCommunityController);
router.get("/list", getCommunitiesController);
router.get("/:id", getCommunityByIdController);
router.put("/:id", updateCommunityController);
router.delete("/:id", deleteCommunityController);
router.delete("/:id/leave", leaveCommunityController);

export default router;

