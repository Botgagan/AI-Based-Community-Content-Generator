import { Router } from "express";
import { verifySession } from "../middleware/auth.js";

import {
  getPostsController,
  createPostController,
  updatePostController,
  deletePostController,
  regeneratePostController,
} from "../controllers/posts.controller.js";

const router = Router();

router.get("/",verifySession(), getPostsController);

router.post("/create", verifySession(), createPostController);

router.put("/:id", verifySession(), updatePostController);

router.delete("/:id", verifySession(), deletePostController);

router.patch("/:id/regenerate", verifySession(), regeneratePostController);

export default router;