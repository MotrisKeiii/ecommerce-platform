import express from "express";

import {
  createReviewController,
  getReviewsByProductController,
  getMyReviewsController,
  updateReviewController,
  deleteReviewController,
} from "../controllers/review.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Xem review của một sản phẩm
router.get("/product/:productId", getReviewsByProductController);

// Xem review của chính mình
router.get("/my", authMiddleware, getMyReviewsController);

// Tạo review
router.post("/", authMiddleware, createReviewController);

// Sửa review của mình
router.patch("/:id", authMiddleware, updateReviewController);

// Xóa review của mình
router.delete("/:id", authMiddleware, deleteReviewController);

export default router;
