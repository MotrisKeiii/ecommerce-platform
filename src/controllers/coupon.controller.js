import {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from "../services/coupon.service.js";

import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
} from "../validators/coupon.validator.js";

export const createCouponController = async (req, res, next) => {
  try {
    const validatedData = createCouponSchema.parse(req.body);

    const coupon = await createCoupon(validatedData);

    return res.status(201).json({
      success: true,
      data: coupon,
      message: "Coupon created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getCouponsController = async (req, res, next) => {
  try {
    const coupons = await getCoupons();

    return res.status(200).json({
      success: true,
      data: coupons,
      message: "Get coupons successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getCouponByIdController = async (req, res, next) => {
  try {
    const coupon = await getCouponById(req.params.id);

    return res.status(200).json({
      success: true,
      data: coupon,
      message: "Get coupon successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updateCouponController = async (req, res, next) => {
  try {
    const validatedData = updateCouponSchema.parse(req.body);

    const coupon = await updateCoupon(req.params.id, validatedData);

    return res.status(200).json({
      success: true,
      data: coupon,
      message: "Coupon updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCouponController = async (req, res, next) => {
  try {
    await deleteCoupon(req.params.id);

    return res.status(200).json({
      success: true,
      data: null,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const validateCouponController = async (req, res, next) => {
  try {
    const validatedData = validateCouponSchema.parse(req.body);

    const result = await validateCoupon(
      validatedData.code,
      validatedData.orderAmount,
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: "Coupon is valid",
    });
  } catch (error) {
    next(error);
  }
};
