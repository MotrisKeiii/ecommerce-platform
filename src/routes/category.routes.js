import express from "express";

import {
  createCategoryController,
  getCategoriesController,
  getCategoryByIdController,
  updateCategoryController,
  deleteCategoryController,
} from "../controllers/category.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/", getCategoriesController);

router.get("/:id", getCategoryByIdController);

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  createCategoryController,
);

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updateCategoryController,
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteCategoryController,
);

export default router;
