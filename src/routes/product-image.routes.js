import express from "express";

import {
  getProductImagesController,
  createProductImageController,
  getProductImageByIdController,
  updateProductImageController,
  deleteProductImageController,
} from "../controllers/product-image.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

// GET /api/products/:productId/images
router.get("/:productId/images", getProductImagesController);

// POST /api/products/:productId/images
router.post(
  "/:productId/images",
  authMiddleware,
  roleMiddleware("admin"),
  createProductImageController,
);

export default router;
