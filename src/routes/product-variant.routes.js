import express from "express";

import {
  getProductVariantByIdController,
  updateProductVariantController,
  deleteProductVariantController,
} from "../controllers/product-variant.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

// GET /api/product-variants/:id
router.get("/:id", getProductVariantByIdController);

// PATCH /api/product-variants/:id
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updateProductVariantController,
);

// DELETE /api/product-variants/:id
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteProductVariantController,
);

export default router;
