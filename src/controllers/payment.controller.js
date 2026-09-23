import { processMockPayment } from "../services/payment.service.js";

export const processMockPaymentController = async (req, res, next) => {
  try {
    const paymentId = Number(req.params.id);
    const success = req.body.success;

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
