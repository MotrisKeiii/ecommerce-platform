import express from "express";

import {
  createProductController,
  getProductsController,
  getProductByIdController,
  updateProductController,
  deleteProductController,
} from "../controllers/product.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import {
  createProductVariantController,
  getProductVariantsController,
} from "../controllers/product-variant.controller.js";

const router = express.Router();

router.get("/", getProductsController);

router.get("/:id", getProductByIdController);

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  createProductController,
);

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updateProductController,
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteProductController,
);

router.get("/:productId/variants", getProductVariantsController);

router.post(
  "/:productId/variants",
  authMiddleware,
  roleMiddleware("admin"),
  createProductVariantController,
);

export default router;
