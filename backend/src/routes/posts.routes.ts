import { Router } from "express";
import { verifySession } from "../middleware/auth.js";

import {
  getPostsController,
  updatePostController,
  deletePostController,
  generatePostsController,
  regeneratePostController,
} from "../controllers/posts.controller.js";

const router = Router();

router.get("/",verifySession(), getPostsController);

router.post("/generate", verifySession(), generatePostsController);

router.put("/:id", verifySession(), updatePostController);

router.delete("/:id", verifySession(), deletePostController);

router.patch("/:id/regenerate", verifySession(), regeneratePostController);

export default router;