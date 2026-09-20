import pool from "../config/database.js";
import AppError from "../utils/AppError.js";
import { validateCoupon } from "./coupon.service.js";

export const checkout = async (
  userId,
  { addressId, paymentMethod, couponCode, note },
) => {
  // 1. Lấy cart
  const [cartItems] = await pool.query(
    `
      SELECT
        ci.id,
        ci.product_variant_id,
        ci.quantity,
        pv.product_id,
        pv.sku,
        pv.price,
        pv.stock,
        pv.attributes,
        pv.status AS variant_status,
        p.name AS product_name,
        p.status AS product_status
      FROM cart_items ci
      JOIN product_variants pv
        ON ci.product_variant_id = pv.id
      JOIN products p
        ON pv.product_id = p.id
      WHERE ci.user_id = ?
    `,
    [userId],
  );

  // Cart rỗng
  if (cartItems.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  // 2. Kiểm tra product / variant / stock
  for (const item of cartItems) {
    if (item.variant_status !== "active") {
      throw new AppError(`Product variant ${item.sku} is not available`, 400);
    }

    if (item.product_status !== "active") {
      throw new AppError(`Product ${item.product_name} is not available`, 400);
    }

    if (item.quantity > item.stock) {
      throw new AppError(
        `Only ${item.stock} items available for ${item.product_name}`,
        400,
      );
    }
  }

  // 3. Tính subtotal
  const subtotal = cartItems.reduce((total, item) => {
    return total + Number(item.price) * item.quantity;
  }, 0);

  // 4. Kiểm tra address
  const [addresses] = await pool.query(
    `
      SELECT
        id,
        recipient_name,
        phone,
        province,
        district,
        ward,
        address_line
      FROM addresses
      WHERE id = ?
      AND user_id = ?
    `,
    [addressId, userId],
  );

  if (addresses.length === 0) {
    throw new AppError("Address not found", 404);
  }

  const address = addresses[0];

  // 5. Kiểm tra coupon
  let discountAmount = 0;
  let coupon = null;

  if (couponCode) {
    const couponResult = await validateCoupon(couponCode, subtotal);

    discountAmount = couponResult.discountAmount;
    coupon = couponResult;
  }

  // 6. Tính shipping và total
  const shippingFee = 30000;

  const totalAmount = subtotal - discountAmount + shippingFee;

  // 7. Bắt đầu transaction
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 8. Tạo order code
    const orderCode = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 9. Tạo order
    const [orderResult] = await connection.query(
      `
        INSERT INTO orders (
          order_code,
          user_id,
          subtotal,
          discount_amount,
          shipping_fee,
          total_amount,
          status,
          payment_status,
          payment_method,
          shipping_recipient_name,
          shipping_phone,
          shipping_province,
          shipping_district,
          shipping_ward,
          shipping_address_line,
          coupon_code,
          note
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        orderCode,
        userId,
        subtotal,
        discountAmount,
        shippingFee,
        totalAmount,
        "pending",
        "pending",
        paymentMethod,
        address.recipient_name,
        address.phone,
        address.province,
        address.district,
        address.ward,
        address.address_line,
        coupon?.code || null,
        note || null,
      ],
    );

    const orderId = orderResult.insertId;

    // Lock coupon để tránh vượt usage_limit
    if (coupon) {
      const [coupons] = await connection.query(
        `
      SELECT
        id,
        code,
        usage_limit,
        used_count,
        status,
        start_at,
        end_at
      FROM coupons
      WHERE id = ?
      FOR UPDATE
    `,
        [coupon.couponId],
      );

      if (coupons.length === 0) {
        throw new AppError("Coupon not found", 404);
      }

      const lockedCoupon = coupons[0];

      if (lockedCoupon.status !== "active") {
        throw new AppError("Coupon is not active", 400);
      }

      if (
        lockedCoupon.usage_limit !== null &&
        lockedCoupon.used_count >= lockedCoupon.usage_limit
      ) {
        throw new AppError("Coupon usage limit has been reached", 400);
      }
    }

    // 10. Lock và kiểm tra stock
    for (const item of cartItems) {
      const [variants] = await connection.query(
        `
          SELECT
            id,
            stock,
            status
          FROM product_variants
          WHERE id = ?
          FOR UPDATE
        `,
        [item.product_variant_id],
      );

      if (variants.length === 0) {
        throw new AppError("Product variant not found", 404);
      }

      const variant = variants[0];

      if (variant.status !== "active") {
        throw new AppError(`Product variant ${item.sku} is not available`, 400);
      }

      if (item.quantity > variant.stock) {
        throw new AppError(`Only ${variant.stock} items available`, 400);
      }

      // Trừ stock
      await connection.query(
        `
          UPDATE product_variants
          SET stock = stock - ?
          WHERE id = ?
        `,
        [item.quantity, item.product_variant_id],
      );

      // Ghi lịch sử thay đổi stock
      await connection.query(
        `
          INSERT INTO inventory_transactions (
            product_variant_id,
            type,
            quantity,
            reference_type,
            reference_id,
            note
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          item.product_variant_id,
          "sale",
          -item.quantity,
          "order",
          orderId,
          "Stock deducted for order",
        ],
      );
    }

    // 11. Tạo order_items
    for (const item of cartItems) {
      const itemSubtotal = Number(item.price) * item.quantity;

      await connection.query(
        `
          INSERT INTO order_items (
            order_id,
            product_id,
            product_variant_id,
            product_name,
            variant_attributes,
            sku,
            price_at_purchase,
            quantity,
            subtotal
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          orderId,
          item.product_id,
          item.product_variant_id,
          item.product_name,
          typeof item.attributes === "string"
            ? item.attributes
            : JSON.stringify(item.attributes),
          item.sku,
          item.price,
          item.quantity,
          itemSubtotal,
        ],
      );
    }

    // 12. Tạo payment
    await connection.query(
      `
        INSERT INTO payments (
          order_id,
          provider,
          amount,
          status
        )
        VALUES (?, ?, ?, ?)
      `,
      [orderId, paymentMethod, totalAmount, "pending"],
    );

    // 13. Cập nhật coupon usage
    if (coupon) {
      await connection.query(
        `
      UPDATE coupons
      SET used_count = used_count + 1
      WHERE id = ?
    `,
        [coupon.couponId],
      );
    }

    // 14. Xóa cart
    await connection.query(
      `
    DELETE FROM cart_items
    WHERE user_id = ?
  `,
      [userId],
    );

    await connection.commit();

    return {
      orderId,
      orderCode,
      subtotal,
      discountAmount,
      shippingFee,
      totalAmount,
      paymentMethod,
      status: "pending",
      paymentStatus: "pending",
    };
  } catch (error) {
    // Có lỗi → hoàn tác toàn bộ transaction
    await connection.rollback();

    throw error;
  } finally {
    // Trả connection về pool
    connection.release();
  }
};
