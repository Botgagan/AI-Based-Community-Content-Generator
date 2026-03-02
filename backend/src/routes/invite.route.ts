import { Router } from "express";
import { verifySession } from "../middleware/auth.js";
import {
  sendInviteController,
  acceptInviteController,
  validateInviteController,
} from "../controllers/invite.controller.js";

const router = Router();

router.post("/send", verifySession(), sendInviteController);
router.get("/validate/:token", validateInviteController);
router.post("/accept/:token", verifySession(), acceptInviteController);

export default router;