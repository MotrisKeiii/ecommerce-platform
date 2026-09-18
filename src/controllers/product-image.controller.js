import {
  createProductImage,
  getProductImages,
  getProductImageById,
  updateProductImage,
  deleteProductImage,
} from "../services/product-image.service.js";

import {
  createProductImageSchema,
  updateProductImageSchema,
} from "../validators/product-image.validator.js";

export const createProductImageController = async (req, res, next) => {
  try {
    const validatedData = createProductImageSchema.parse(req.body);

    const image = await createProductImage({
      ...validatedData,
      productId: Number(req.params.productId),
    });

    return res.status(201).json({
      success: true,
      data: image,
      message: "Product image created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getProductImagesController = async (req, res, next) => {
  try {
    const images = await getProductImages(Number(req.params.productId));

    return res.status(200).json({
      success: true,
      data: images,
      message: "Get product images successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getProductImageByIdController = async (req, res, next) => {
  try {
    const image = await getProductImageById(Number(req.params.id));

    return res.status(200).json({
      success: true,
      data: image,
      message: "Get product image successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updateProductImageController = async (req, res, next) => {
  try {
    const validatedData = updateProductImageSchema.parse(req.body);

    const image = await updateProductImage(
      Number(req.params.id),
      validatedData,
    );

    return res.status(200).json({
      success: true,
      data: image,
      message: "Product image updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProductImageController = async (req, res, next) => {
  try {
    await deleteProductImage(Number(req.params.id));

    return res.status(200).json({
      success: true,
      data: null,
      message: "Product image deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
