import express from "express";

import {
  addToWishlistController,
  getWishlistController,
  removeFromWishlistController,
} from "../controllers/wishlist.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getWishlistController);

router.post("/:productId", authMiddleware, addToWishlistController);

router.delete("/:productId", authMiddleware, removeFromWishlistController);

export default router;
