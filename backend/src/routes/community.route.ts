import { Router } from "express";
import { verifySession } from "../middleware/auth";
import { createCommunityController,getCommunitiesController, updateCommunityController, deleteCommunityController, getCommunityByIdController, leaveCommunityController } from "../controllers/community.controllers";

const router = Router();

router.post("/create", verifySession(), createCommunityController);
router.get("/list", verifySession(), getCommunitiesController);
router.get("/:id", verifySession(), getCommunityByIdController);
router.put("/:id", verifySession(), updateCommunityController);//this id is uuid in communities table that will be fetched using useparams and then details will be shown on frontend using mapping.
router.delete("/:id", verifySession(), deleteCommunityController);
router.post("/:id/leave", verifySession(), leaveCommunityController);

export default router;

