import {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand
} from "../services/brand.service.js";
import { createBrandSchema } from "../validators/brand.validator.js";

export const createBrandController = async (req, res, next) => {
  try {
    const validatedData = createBrandSchema.parse(req.body);

    const brand = await createBrand(validatedData);

    return res.status(201).json({
      success: true,
      data: brand,
      message: "Brand created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getBrandsController = async (req, res, next) => {
  try {
    const brands = await getBrands();

    return res.status(200).json({
      success: true,
      data: brands,
      message: "Get brands successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getBrandByIdController = async (req, res, next) => {
  try {
    const brand = await getBrandById(req.params.id);

    return res.status(200).json({
      success: true,
      data: brand,
      message: "Get brand successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updateBrandController = async (req, res, next) => {
  try {
    const validatedData = updateBrandSchema.parse(req.body);

    const brand = await updateBrand(req.params.id, validatedData);

    return res.status(200).json({
      success: true,
      data: brand,
      message: "Brand updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBrandController = async (req, res, next) => {
  try {
    await deleteBrand(req.params.id);

    return res.status(200).json({
      success: true,
      data: null,
      message: "Brand deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
