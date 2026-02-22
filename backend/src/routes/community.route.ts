import { Router } from "express";
import { verifySession } from "../middleware/auth";
import { createCommunityController,getCommunitiesController, updateCommunityController, deleteCommunityController } from "../controllers/community.controllers.js";

const router = Router();

router.post("/create", verifySession(), createCommunityController);
router.get("/list", verifySession(), getCommunitiesController);
router.put("/:id", verifySession(), updateCommunityController);//this id is uuid in communities table that will be fetched using useparams and then details will be shown on frontend using mapping.
router.delete("/:id", verifySession(), deleteCommunityController);



export default router;

