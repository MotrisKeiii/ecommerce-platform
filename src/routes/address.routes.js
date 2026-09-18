import express from "express";

import {
  createAddressController,
  getAddressesController,
  getAddressByIdController,
  updateAddressController,
  deleteAddressController,
} from "../controllers/address.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getAddressesController);

router.get("/:id", authMiddleware, getAddressByIdController);

router.post("/", authMiddleware, createAddressController);

router.patch("/:id", authMiddleware, updateAddressController);

router.delete("/:id", authMiddleware, deleteAddressController);

export default router;
