import jwt from "jsonwebtoken";

import { register, login } from "../services/auth.service.js";

import { registerSchema, loginSchema } from "../validators/auth.validator.js";

export const registerController = async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const user = await register(validatedData);

    return res.status(201).json({
      success: true,
      data: user,
      message: "Register successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const loginController = async (req, res, next) => {
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
      maxAge: (jwt.decode(token).exp - Math.floor(Date.now() / 1000)) * 1000,
    });

    return res.status(200).json({
      success: true,
      data: user,
      message: "Login successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const meController = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.user,
    message: "Get current user successfully",
  });
};
