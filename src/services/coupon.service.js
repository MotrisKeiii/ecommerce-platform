import pool from "../config/database.js";
import AppError from "../utils/AppError.js";

export const createCoupon = async ({
  code,
  discountType,
  discountValue,
  minOrderAmount,
  maxDiscountAmount,
  usageLimit,
  startAt,
  endAt,
  status,
}) => {
  // 1. Kiểm tra thời gian
  if (new Date(endAt) <= new Date(startAt)) {
    throw new AppError("End date must be after start date", 400);
  }

  // 2. Kiểm tra discount percentage
  if (discountType === "percentage" && discountValue > 100) {
    throw new AppError("Percentage discount cannot exceed 100", 400);
  }

  // 3. Kiểm tra coupon code đã tồn tại chưa
  const [existingCoupons] = await pool.query(
    `
      SELECT id
      FROM coupons
      WHERE code = ?
    `,
    [code],
  );

  if (existingCoupons.length > 0) {
    throw new AppError("Coupon code already exists", 409);
  }

  // 4. Tạo coupon
  const [result] = await pool.query(
    `
      INSERT INTO coupons (
        code,
        discount_type,
        discount_value,
        min_order_amount,
        max_discount_amount,
        usage_limit,
        used_count,
        start_at,
        end_at,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    `,
    [
      code,
      discountType,
      discountValue,
      minOrderAmount ?? 0,
      maxDiscountAmount ?? null,
      usageLimit ?? null,
      startAt,
      endAt,
      status ?? "active",
    ],
  );

  return {
    id: result.insertId,
    code,
    discountType,
    discountValue,
    minOrderAmount: minOrderAmount ?? 0,
    maxDiscountAmount: maxDiscountAmount ?? null,
    usageLimit: usageLimit ?? null,
    usedCount: 0,
    startAt,
    endAt,
    status: status ?? "active",
  };
};

export const getCoupons = async () => {
  const [coupons] = await pool.query(
    `
      SELECT
        id,
        code,
        discount_type,
        discount_value,
        min_order_amount,
        max_discount_amount,
        usage_limit,
        used_count,
        start_at,
        end_at,
        status,
        created_at,
        updated_at
      FROM coupons
      ORDER BY id DESC
    `,
  );

  return coupons;
};

export const getCouponById = async (id) => {
  const [coupons] = await pool.query(
    `
      SELECT
        id,
        code,
        discount_type,
        discount_value,
        min_order_amount,
        max_discount_amount,
        usage_limit,
        used_count,
        start_at,
        end_at,
        status,
        created_at,
        updated_at
      FROM coupons
      WHERE id = ?
    `,
    [id],
  );

  if (coupons.length === 0) {
    throw new AppError("Coupon not found", 404);
  }

  return coupons[0];
};

export const updateCoupon = async (id, data) => {
  // 1. Kiểm tra coupon có tồn tại không
  const [coupons] = await pool.query(
    `
      SELECT
        id,
        code,
        discount_type,
        discount_value,
        min_order_amount,
        max_discount_amount,
        usage_limit,
        start_at,
        end_at,
        status
      FROM coupons
      WHERE id = ?
    `,
    [id],
  );

  if (coupons.length === 0) {
    throw new AppError("Coupon not found", 404);
  }

  const currentCoupon = coupons[0];

  // 2. Lấy dữ liệu mới, nếu field không gửi thì giữ dữ liệu cũ
  const updatedCoupon = {
    code: data.code ?? currentCoupon.code,
    discountType: data.discountType ?? currentCoupon.discount_type,
    discountValue: data.discountValue ?? currentCoupon.discount_value,
    minOrderAmount: data.minOrderAmount ?? currentCoupon.min_order_amount,
    maxDiscountAmount:
      data.maxDiscountAmount ?? currentCoupon.max_discount_amount,
    usageLimit: data.usageLimit ?? currentCoupon.usage_limit,
    startAt: data.startAt ?? currentCoupon.start_at,
    endAt: data.endAt ?? currentCoupon.end_at,
    status: data.status ?? currentCoupon.status,
  };

  // 3. Kiểm tra thời gian
  if (new Date(updatedCoupon.endAt) <= new Date(updatedCoupon.startAt)) {
    throw new AppError("End date must be after start date", 400);
  }

  // 4. Kiểm tra percentage
  if (
    updatedCoupon.discountType === "percentage" &&
    updatedCoupon.discountValue > 100
  ) {
    throw new AppError("Percentage discount cannot exceed 100", 400);
  }

  // 5. Kiểm tra code có bị coupon khác sử dụng chưa
  const [existingCoupons] = await pool.query(
    `
      SELECT id
      FROM coupons
      WHERE code = ?
      AND id != ?
    `,
    [updatedCoupon.code, id],
  );

  if (existingCoupons.length > 0) {
    throw new AppError("Coupon code already exists", 409);
  }

  // 6. Update database
  await pool.query(
    `
      UPDATE coupons
      SET
        code = ?,
        discount_type = ?,
        discount_value = ?,
        min_order_amount = ?,
        max_discount_amount = ?,
        usage_limit = ?,
        start_at = ?,
        end_at = ?,
        status = ?
      WHERE id = ?
    `,
    [
      updatedCoupon.code,
      updatedCoupon.discountType,
      updatedCoupon.discountValue,
      updatedCoupon.minOrderAmount,
      updatedCoupon.maxDiscountAmount,
      updatedCoupon.usageLimit,
      updatedCoupon.startAt,
      updatedCoupon.endAt,
      updatedCoupon.status,
      id,
    ],
  );

  return {
    id: Number(id),
    ...updatedCoupon,
  };
};

export const deleteCoupon = async (id) => {
  // 1. Kiểm tra coupon có tồn tại không
  const [coupons] = await pool.query(
    `
      SELECT id
      FROM coupons
      WHERE id = ?
    `,
    [id],
  );

  if (coupons.length === 0) {
    throw new AppError("Coupon not found", 404);
  }

  // 2. Xóa coupon
  await pool.query(
    `
      DELETE FROM coupons
      WHERE id = ?
    `,
    [id],
  );
};

export const validateCoupon = async (code, orderAmount) => {
  // 1. Tìm coupon
  const [coupons] = await pool.query(
    `
      SELECT
        id,
        code,
        discount_type,
        discount_value,
        min_order_amount,
        max_discount_amount,
        usage_limit,
        used_count,
        start_at,
        end_at,
        status
      FROM coupons
      WHERE code = ?
    `,
    [code],
  );

  if (coupons.length === 0) {
    throw new AppError("Coupon not found", 404);
  }

  const coupon = coupons[0];

  // 2. Kiểm tra trạng thái
  if (coupon.status !== "active") {
    throw new AppError("Coupon is inactive", 400);
  }

  // 3. Kiểm tra thời gian bắt đầu
  const now = new Date();

  if (now < new Date(coupon.start_at)) {
    throw new AppError("Coupon is not available yet", 400);
  }

  // 4. Kiểm tra thời gian hết hạn
  if (now > new Date(coupon.end_at)) {
    throw new AppError("Coupon has expired", 400);
  }

  // 5. Kiểm tra số lần sử dụng
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    throw new AppError("Coupon usage limit reached", 400);
  }

  // 6. Kiểm tra giá trị đơn hàng tối thiểu
  if (orderAmount < coupon.min_order_amount) {
    throw new AppError(
      `Minimum order amount is ${coupon.min_order_amount}`,
      400,
    );
  }

  // 7. Tính discount
  let discountAmount = 0;

  if (coupon.discount_type === "percentage") {
    discountAmount = (orderAmount * coupon.discount_value) / 100;

    // Không cho giảm vượt quá mức tối đa
    if (
      coupon.max_discount_amount !== null &&
      discountAmount > coupon.max_discount_amount
    ) {
      discountAmount = coupon.max_discount_amount;
    }
  }

  if (coupon.discount_type === "fixed") {
    discountAmount = coupon.discount_value;
  }

  // 8. Không cho discount lớn hơn giá trị đơn
  if (discountAmount > orderAmount) {
    discountAmount = orderAmount;
  }

  return {
    couponId: coupon.id,
    code: coupon.code,
    discountAmount,
  };
};