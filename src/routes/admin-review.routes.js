import express from "express";

import {
  getAllReviewsController,
  updateReviewStatusController,
} from "../controllers/review.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  getAllReviewsController,
);

router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("admin"),
  updateReviewStatusController,
);

export default router;
