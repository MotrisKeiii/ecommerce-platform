import {
  createReview,
  getReviewsByProduct,
  getMyReviews,
  updateReview,
  deleteReview,
  getAllReviews,
  updateReviewStatus,
} from "../services/review.service.js";

import {
  createReviewSchema,
  updateReviewSchema,
} from "../validators/review.validator.js";

import { updateReviewStatusSchema } from "../validators/review.validator.js";

export const createReviewController = async (req, res, next) => {
  try {
    const validatedData = createReviewSchema.parse(req.body);

    const review = await createReview(req.user.userId, validatedData);

    return res.status(201).json({
      success: true,
      data: review,
      message: "Review created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getReviewsByProductController = async (req, res, next) => {
  try {
    const productId = Number(req.params.productId);

    const reviews = await getReviewsByProduct(productId);

    return res.status(200).json({
      success: true,
      data: reviews,
      message: "Get product reviews successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getMyReviewsController = async (req, res, next) => {
  try {
    const reviews = await getMyReviews(req.user.userId);

    return res.status(200).json({
      success: true,
      data: reviews,
      message: "Get my reviews successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updateReviewController = async (req, res, next) => {
  try {
    const validatedData = updateReviewSchema.parse(req.body);

    const review = await updateReview(
      req.user.userId,
      req.params.id,
      validatedData,
    );

    return res.status(200).json({
      success: true,
      data: review,
      message: "Review updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReviewController = async (req, res, next) => {
  try {
    await deleteReview(req.user.userId, req.params.id);

    return res.status(200).json({
      success: true,
      data: null,
      message: "Review deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getAllReviewsController = async (req, res, next) => {
  try {
    const reviews = await getAllReviews();

    return res.status(200).json({
      success: true,
      data: reviews,
      message: "Get all reviews successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updateReviewStatusController = async (req, res, next) => {
  try {
    const validatedData = updateReviewStatusSchema.parse(req.body);

    const review = await updateReviewStatus(
      req.params.id,
      validatedData.status,
    );

    return res.status(200).json({
      success: true,
      data: review,
      message: "Review status updated successfully",
    });
  } catch (error) {
    next(error);
  }
};