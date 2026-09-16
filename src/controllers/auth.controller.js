import jwt from "jsonwebtoken";

import { register, login } from "../services/auth.service.js";

import { registerSchema, loginSchema } from "../validators/auth.validator.js";

export const registerController = async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const user = await register(validatedData);

    return res.status(201).json({
      success: true,
      data: user,
      message: "Register successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      data: null,
      message: error.message,
    });
  }
};

export const loginController = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await login(validatedData);

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      data: user,
      message: "Login successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      data: null,
      message: error.message,
    });
  }
};

export const meController = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.user,
    message: "Get current user successfully",
  });
};