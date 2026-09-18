import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../services/category.service.js";

import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/category.validator.js";

export const createCategoryController = async (req, res, next) => {
  try {
    const validatedData = createCategorySchema.parse(req.body);

    const category = await createCategory(validatedData);

    return res.status(201).json({
      success: true,
      data: category,
      message: "Category created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoriesController = async (req, res, next) => {
  try {
    const categories = await getCategories();

    return res.status(200).json({
      success: true,
      data: categories,
      message: "Get categories successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryByIdController = async (req, res, next) => {
  try {
    const category = await getCategoryById(req.params.id);

    return res.status(200).json({
      success: true,
      data: category,
      message: "Get category successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategoryController = async (req, res, next) => {
  try {
    const validatedData = updateCategorySchema.parse(req.body);

    const category = await updateCategory(req.params.id, validatedData);

    return res.status(200).json({
      success: true,
      data: category,
      message: "Category updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategoryController = async (req, res, next) => {
  try {
    await deleteCategory(req.params.id);

    return res.status(200).json({
      success: true,
      data: null,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
