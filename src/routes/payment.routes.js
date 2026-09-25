import express from "express";

import { processMockPaymentController } from "../controllers/payment.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

const requireMockPaymentEnabled = (req, res, next) => {
  if (process.env.ENABLE_MOCK_PAYMENT !== "true") {
    return res.status(404).json({
      success: false,
      data: null,
      message: "Not found",
    });
  }
  next();
};

router.post(
  "/:id/mock",
  requireMockPaymentEnabled,
  authMiddleware,
  processMockPaymentController,
);

export default router;
