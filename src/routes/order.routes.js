import express from "express";

import {
  getMyOrdersController,
  getMyOrderByIdController,
  updateOrderStatusController,
} from "../controllers/order.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getMyOrdersController);

router.get("/:id", authMiddleware, getMyOrderByIdController);

router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("admin"),
  updateOrderStatusController,
);

export default router;
