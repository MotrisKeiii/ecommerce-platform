import express from "express";

import {
  getAllOrdersController,
  getOrderByIdController,
  updateOrderStatusController,
} from "../controllers/admin-order.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware("admin"));

router.get("/", getAllOrdersController);
router.get("/:id", getOrderByIdController);
router.patch("/:id/status", updateOrderStatusController);

export default router;
