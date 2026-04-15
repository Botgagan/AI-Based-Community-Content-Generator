import { Router } from "express";
import { verifySession } from "../middleware/auth.js";

import {
  getPostsController,
  updatePostController,
  deletePostController,
  generatePostsController,
  regeneratePostController,
  reviewPostController,
  schedulePostForFacebookController,
  getFacebookPostSchedulesController,
  markFacebookScheduleSharedController,
} from "../controllers/posts.controller.js";

const router = Router();

router.get("/",verifySession(), getPostsController);

router.post("/generate", verifySession(), generatePostsController);
router.get("/schedules", verifySession(), getFacebookPostSchedulesController);

router.put("/:id", verifySession(), updatePostController);

router.delete("/:id", verifySession(), deletePostController);

router.patch("/:id/regenerate", verifySession(), regeneratePostController);
router.patch("/:id/review", verifySession(), reviewPostController);
router.post("/:id/schedule-facebook", verifySession(), schedulePostForFacebookController);
router.patch("/schedules/:scheduleId/shared", verifySession(), markFacebookScheduleSharedController);

export default router;
