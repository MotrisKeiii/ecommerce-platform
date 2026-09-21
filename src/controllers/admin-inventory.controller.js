import {
  createInventoryTransaction,
  getInventoryTransactions,
} from "../services/admin-inventory.service.js";

export const createInventoryTransactionController = async (req, res, next) => {
  try {
    const result = await createInventoryTransaction(req.body);

    return res.status(201).json({
      success: true,
      data: result,
      message: "Inventory updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryTransactionsController = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type, productVariantId } = req.query;

    const result = await getInventoryTransactions({
      page: Number(page),
      limit: Number(limit),
      type,
      productVariantId: productVariantId ? Number(productVariantId) : undefined,
    });

    return res.status(200).json({
      success: true,
      data: result,
      message: "Inventory transactions retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};