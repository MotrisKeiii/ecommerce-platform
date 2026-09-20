import { checkout } from "../services/checkout.service.js";
import { checkoutSchema } from "../validators/checkout.validator.js";

export const checkoutController = async (req, res, next) => {
  try {
    const validatedData = checkoutSchema.parse(req.body);

    const order = await checkout(req.user.userId, validatedData);

    return res.status(201).json({
      success: true,
      data: order,
      message: "Checkout successfully",
    });
  } catch (error) {
    next(error);
  }
};
