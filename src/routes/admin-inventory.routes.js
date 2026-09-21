import express from "express";

import {
  createInventoryTransactionController,
  getInventoryTransactionsController,
} from "../controllers/admin-inventory.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

import { createInventoryTransactionSchema } from "../validators/inventory.validator.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware("admin"));

router.post(
  "/",
  validate(createInventoryTransactionSchema),
  createInventoryTransactionController,
);

router.get("/", getInventoryTransactionsController);

export default router;
