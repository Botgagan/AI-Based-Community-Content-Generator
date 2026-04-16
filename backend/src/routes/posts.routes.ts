import { Router } from "express";
import { verifySession } from "../middleware/auth.js";

import {
  getPostsController,
  updatePostController,
  deletePostController,
  generatePostsController,
  regeneratePostController,
  reviewPostController,
} from "../controllers/posts.controller.js";

const router = Router();

router.get("/",verifySession(), getPostsController);

router.post("/generate", verifySession(), generatePostsController);

router.put("/:id", verifySession(), updatePostController);

router.delete("/:id", verifySession(), deletePostController);

router.patch("/:id/regenerate", verifySession(), regeneratePostController);
router.patch("/:id/review", verifySession(), reviewPostController);

export default router;
