import {
  getMyOrders,
  getMyOrderById,
  updateOrderStatus,
} from "../services/order.service.js";

import { updateOrderStatusSchema } from "../validators/order.validator.js";

export const getMyOrdersController = async (req, res, next) => {
  try {
    const orders = await getMyOrders(req.user.userId);

    return res.status(200).json({
      success: true,
      data: orders,
      message: "Get orders successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrderByIdController = async (req, res, next) => {
  try {
    const order = await getMyOrderById(req.user.userId, req.params.id);

    return res.status(200).json({
      success: true,
      data: order,
      message: "Get order successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatusController = async (req, res, next) => {
  try {
    const validatedData = updateOrderStatusSchema.parse(req.body);

    const order = await updateOrderStatus(req.params.id, validatedData.status);

    return res.status(200).json({
      success: true,
      data: order,
      message: "Order status updated successfully",
    });
  } catch (error) {
    next(error);
  }
};
