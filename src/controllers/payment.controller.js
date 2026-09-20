import {
  createPayment,
  processMockPayment,
} from "../services/payment.service.js";

import { createPaymentSchema } from "../validators/payment.validator.js";

export const createPaymentController = async (req, res, next) => {
  try {
    const validatedData = createPaymentSchema.parse(req.body);

    const payment = await createPayment(req.user.userId, validatedData);

    return res.status(201).json({
      success: true,
      data: payment,
      message: "Payment created successfully",
    });
  } catch (error) {
    next(error);
  }
};

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

