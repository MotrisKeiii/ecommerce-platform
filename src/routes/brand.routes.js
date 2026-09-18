import express from "express";

import {
  createBrandController,
  getBrandsController,
  getBrandByIdController,
  updateBrandController,
  deleteBrandController
} from "../controllers/brand.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  createBrandController,
);
router.get("/", getBrandsController);
router.get("/:id", getBrandByIdController);
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updateBrandController,
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteBrandController,
);

export default router;
