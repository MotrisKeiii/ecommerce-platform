import express from "express";

import {
  createCouponController,
  getCouponsController,
  getCouponByIdController,
  updateCouponController,
  deleteCouponController,
  validateCouponController,
} from "../controllers/coupon.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

// Customer
router.post("/validate", authMiddleware, validateCouponController);

// Admin
router.get("/", authMiddleware, roleMiddleware("admin"), getCouponsController);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  getCouponByIdController,
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  createCouponController,
);

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updateCouponController,
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteCouponController,
);

export default router;
