import express from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getCurrentUserController } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/me", authMiddleware, getCurrentUserController);

export default router;
