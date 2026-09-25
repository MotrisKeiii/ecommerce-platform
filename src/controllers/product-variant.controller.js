import {
  createProductVariant,
  getProductVariants,
  getProductVariantById,
  updateProductVariant,
  deleteProductVariant,
} from "../services/product-variant.service.js";

import {
  createProductVariantSchema,
  updateProductVariantSchema,
} from "../validators/product-variant.validator.js";

export const createProductVariantController = async (req, res, next) => {
  try {
    const validatedData = createProductVariantSchema.parse({
      ...req.body,
      productId: Number(req.params.productId),
    });

    const variant = await createProductVariant(validatedData);

    return res.status(201).json({
      success: true,
      data: variant,
      message: "Product variant created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getProductVariantsController = async (req, res, next) => {
  try {
    const variants = await getProductVariants(
      req.params.productId,
      req.baseUrl.startsWith("/api/admin/"),
    );

    return res.status(200).json({
      success: true,
      data: variants,
      message: "Get product variants successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getProductVariantByIdController = async (req, res, next) => {
  try {
    const variant = await getProductVariantById(
      req.params.id,
      req.baseUrl.startsWith("/api/admin/"),
    );

    return res.status(200).json({
      success: true,
      data: variant,
      message: "Get product variant successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updateProductVariantController = async (req, res, next) => {
  try {
    const validatedData = updateProductVariantSchema.parse(req.body);

    const variant = await updateProductVariant(req.params.id, validatedData);

    return res.status(200).json({
      success: true,
      data: variant,
      message: "Product variant updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProductVariantController = async (req, res, next) => {
  try {
    await deleteProductVariant(req.params.id);

    return res.status(200).json({
      success: true,
      data: null,
      message: "Product variant deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
