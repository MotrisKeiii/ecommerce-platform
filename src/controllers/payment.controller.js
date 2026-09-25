import { processMockPayment } from "../services/payment.service.js";
import { mockPaymentSchema } from "../validators/payment.validator.js";

export const processMockPaymentController = async (req, res, next) => {
  try {
    const paymentId = Number(req.params.id);

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Invalid payment id",
      });
    }

    const { success } = mockPaymentSchema.parse(req.body);

    const payment = await processMockPayment(
      req.user.userId,
      paymentId,
      success,
    );

    return res.status(200).json({
      success: true,
      data: payment,
      message: "Mock payment processed successfully",
    });
  } catch (error) {
    next(error);
  }
};
