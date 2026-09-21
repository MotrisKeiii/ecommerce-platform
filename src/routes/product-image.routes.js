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
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

// GET /api/products/:productId/images
router.get("/:productId/images", getProductImagesController);

// POST /api/products/:productId/images
router.post(
  "/:productId/images",
  authMiddleware,
  roleMiddleware("admin"),
  upload.single("image"),
  createProductImageController,
);

router.get("/image/:id", getProductImageByIdController);

router.patch(
  "/image/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updateProductImageController,
);

router.delete(
  "/image/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteProductImageController,
);

export default router;
