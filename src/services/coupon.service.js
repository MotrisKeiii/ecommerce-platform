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
        used_count,
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

  // `??` coi null như "không gửi" nên không thể xóa giá trị.
  // Dùng `!== undefined` để phân biệt "không gửi" (giữ cũ) và "gửi null" (đặt null).
  const pick = (key, current) =>
    data[key] !== undefined ? data[key] : current;

  // 2. Lấy dữ liệu mới, nếu field không gửi thì giữ dữ liệu cũ
  const updatedCoupon = {
    code: pick("code", currentCoupon.code),
    discountType: pick("discountType", currentCoupon.discount_type),
    discountValue: pick("discountValue", currentCoupon.discount_value),
    minOrderAmount: pick("minOrderAmount", currentCoupon.min_order_amount),
    maxDiscountAmount: pick(
      "maxDiscountAmount",
      currentCoupon.max_discount_amount,
    ),
    usageLimit: pick("usageLimit", currentCoupon.usage_limit),
    startAt: pick("startAt", currentCoupon.start_at),
    endAt: pick("endAt", currentCoupon.end_at),
    status: pick("status", currentCoupon.status),
  };

  if (
    updatedCoupon.usageLimit !== null &&
    updatedCoupon.usageLimit < currentCoupon.used_count
  ) {
    throw new AppError("Usage limit cannot be lower than used count", 400);
  }

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

/**
 * Kiểm tra coupon và tính số tiền giảm.
 * @param connection  mặc định dùng pool; khi checkout truyền connection của transaction
 * @param lock        true -> SELECT ... FOR UPDATE để 2 đơn cùng lúc không vượt usage_limit
 */
export const validateCoupon = async (
  code,
  orderAmount,
  connection = pool,
  { lock = false } = {},
) => {
  const [coupons] = await connection.query(
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
      ${lock ? "FOR UPDATE" : ""}
    `,
    [code],
  );

  if (coupons.length === 0) {
    throw new AppError("Coupon not found", 404);
  }

  const coupon = coupons[0];

  if (coupon.status !== "active") {
    throw new AppError("Coupon is inactive", 400);
  }

  const now = new Date();

  if (now < new Date(coupon.start_at)) {
    throw new AppError("Coupon is not available yet", 400);
  }

  if (now > new Date(coupon.end_at)) {
    throw new AppError("Coupon has expired", 400);
  }

  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    throw new AppError("Coupon usage limit reached", 400);
  }

  // mysql2 trả DECIMAL dạng CHUỖI -> ép sang number trước khi tính/so sánh
  const discountValue = Number(coupon.discount_value);
  const minOrderAmount = Number(coupon.min_order_amount);
  const maxDiscountAmount =
    coupon.max_discount_amount === null
      ? null
      : Number(coupon.max_discount_amount);

  if (orderAmount < minOrderAmount) {
    throw new AppError(`Minimum order amount is ${minOrderAmount}`, 400);
  }

  let discountAmount = 0;

  if (coupon.discount_type === "percentage") {
    discountAmount = (orderAmount * discountValue) / 100;

    if (maxDiscountAmount !== null && discountAmount > maxDiscountAmount) {
      discountAmount = maxDiscountAmount;
    }
  } else if (coupon.discount_type === "fixed") {
    discountAmount = discountValue;
  }

  // Không giảm quá giá trị đơn; làm tròn về số nguyên (VND)
  discountAmount = Math.round(Math.min(discountAmount, orderAmount));

  return {
    couponId: coupon.id,
    code: coupon.code,
    discountAmount,
  };
};
