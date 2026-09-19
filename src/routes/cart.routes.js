import express from "express";

import {
  addToCartController,
  getCartController,
  updateCartItemController,
  removeCartItemController,
  clearCartController,
} from "../controllers/cart.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getCartController);

router.post("/", authMiddleware, addToCartController);

router.patch("/:id", authMiddleware, updateCartItemController);

router.delete("/:id", authMiddleware, removeCartItemController);

router.delete("/", authMiddleware, clearCartController);

export default router;
