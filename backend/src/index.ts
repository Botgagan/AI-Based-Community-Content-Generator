import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { middleware as supertokensMiddleware, errorHandler as supertokensErrorHandler } from "supertokens-node/framework/express";
import * as supertokensNode from "supertokens-node";
import "./config/supertokens";
import communityRoutes from "./routes/community.route.js";
import themesRoutes from "./routes/themes.route.js";
import inviteRoutes from "./routes/invite.route.js";
import postsRoutes from "./routes/posts.routes.js";
import userRoutes from "./routes/user.route.js";
import { startImageWorker } from "./workers/image.worker.js";
import { startFacebookScheduleWorker } from "./workers/facebook.schedule.worker.js";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

const app = express();

/* ---------------- BODY PARSER ---------------- */
app.use(express.json());

/* ---------------- CORS ---------------- */

app.use(
  cors({
    origin: process.env.WEBSITE_DOMAIN,
    allowedHeaders: ["content-type", ...supertokensNode.getAllCORSHeaders()],
    credentials: true,
  })
);

app.use("/api/community", communityRoutes);
app.use("/api/themes", themesRoutes);
app.use("/api/invite", inviteRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/user", userRoutes);

/* ---------------- SUPERTOKENS ---------------- */

app.use(supertokensMiddleware());

/* ---------------- TEST ROUTE ---------------- */

app.get("/", (_, res) => {
  res.send("Backend running");
});

/* ---------------- ERROR HANDLER ---------------- */

app.use(supertokensErrorHandler());

/* ---------------- START SERVER ---------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startImageWorker();
  startFacebookScheduleWorker();
});
