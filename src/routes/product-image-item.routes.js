import express from "express";

import {
  getProductImageByIdController,
  updateProductImageController,
  deleteProductImageController,
} from "../controllers/product-image.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

// GET /api/product-images/:id
router.get("/:id", getProductImageByIdController);

// PATCH /api/product-images/:id
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updateProductImageController,
);

// DELETE /api/product-images/:id
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteProductImageController,
);

export default router;
