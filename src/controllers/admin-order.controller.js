import { getAllOrders, getOrderById } from "../services/admin-order.service.js";
import { updateOrderStatus } from "../services/order.service.js";

export const getAllOrdersController = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, paymentStatus } = req.query;

    const result = await getAllOrders({
      page: Number(page),
      limit: Number(limit),
      status,
      paymentStatus,
    });

    return res.status(200).json({
      success: true,
      data: result,
      message: "Orders retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await getOrderById(Number(id));

    return res.status(200).json({
      success: true,
      data: order,
      message: "Order retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await updateOrderStatus(Number(id), status);

    return res.status(200).json({
      success: true,
      data: result,
      message: "Order status updated successfully",
    });
  } catch (error) {
    next(error);
  }
};