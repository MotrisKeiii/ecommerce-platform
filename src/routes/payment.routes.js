import express from "express";

import { processMockPaymentController } from "../controllers/payment.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/:id/mock", authMiddleware, processMockPaymentController);

export default router;
