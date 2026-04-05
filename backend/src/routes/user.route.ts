import { Router } from "express";
import { verifySession } from "../middleware/auth.js";
import { getMeController } from "../controllers/user.controller.js";

const router = Router();

router.get("/me", verifySession(), getMeController);

export default router;
