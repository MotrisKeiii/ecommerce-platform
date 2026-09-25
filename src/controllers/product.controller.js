import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../services/product.service.js";

import {
  createProductSchema,
  updateProductSchema,
} from "../validators/product.validator.js";

export const createProductController = async (req, res, next) => {
  try {
    const validatedData = createProductSchema.parse(req.body);

    const product = await createProduct(validatedData);

    return res.status(201).json({
      success: true,
      data: product,
      message: "Product created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getProductsController = async (req, res, next) => {
  try {
    const products = await getProducts(req.baseUrl.startsWith("/api/admin/"));

    return res.status(200).json({
      success: true,
      data: products,
      message: "Get products successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getProductByIdController = async (req, res, next) => {
  try {
    const product = await getProductById(
      req.params.id,
      req.baseUrl.startsWith("/api/admin/"),
    );

    return res.status(200).json({
      success: true,
      data: product,
      message: "Get product successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updateProductController = async (req, res, next) => {
  try {
    const validatedData = updateProductSchema.parse(req.body);

    const product = await updateProduct(req.params.id, validatedData);

    return res.status(200).json({
      success: true,
      data: product,
      message: "Product updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProductController = async (req, res, next) => {
  try {
    await deleteProduct(req.params.id);

    return res.status(200).json({
      success: true,
      data: null,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
