import express from "express";

import { checkoutController } from "../controllers/checkout.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, checkoutController);

export default router;
