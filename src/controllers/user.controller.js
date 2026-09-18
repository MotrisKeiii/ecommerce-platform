import { getCurrentUser } from "../services/user.service.js";

export const getCurrentUserController = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.user.userId);

    return res.status(200).json({
      success: true,
      data: user,
      message: "Get current user successfully",
    });
  } catch (error) {
    next(error);
  }
};
