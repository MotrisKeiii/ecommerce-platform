import crypto from "node:crypto";
import pool from "../config/database.js";
import AppError from "../utils/AppError.js";
import { validateCoupon } from "./coupon.service.js";

const SHIPPING_FEE = 30000;

// Date.now() + số ngẫu nhiên 0-999 dễ trùng khi nhiều đơn cùng mili-giây.
// randomBytes(3) = 16 triệu khả năng -> gần như không trùng.
const generateOrderCode = () =>
  `ORD-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

export const checkout = async (
  userId,
  { addressId, paymentMethod, couponCode, note },
) => {
  // TOÀN BỘ checkout (đọc giỏ -> kiểm tra -> trừ kho -> tạo đơn) nằm trong 1 transaction.
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Khóa giỏ hàng để hai request checkout của cùng user không tạo hai đơn.
    const [lockedCart] = await connection.query(
      `SELECT id FROM cart_items WHERE user_id = ? ORDER BY id FOR UPDATE`,
      [userId],
    );

    if (lockedCart.length === 0) {
      throw new AppError("Cart is empty", 400);
    }

    // Khóa từng biến thể theo cùng một thứ tự.
    const [cartVariants] = await connection.query(
      `SELECT product_variant_id
       FROM cart_items
       WHERE user_id = ?
       ORDER BY product_variant_id`,
      [userId],
    );

    for (const variant of cartVariants) {
      await connection.query(
        `SELECT id FROM product_variants WHERE id = ? FOR UPDATE`,
        [variant.product_variant_id],
      );
    }

    const [cartItems] = await connection.query(
      `
        SELECT ci.id, ci.product_variant_id, ci.quantity,
          pv.product_id, pv.sku, pv.price, pv.stock, pv.attributes,
          pv.status AS variant_status,
          p.name AS product_name,
          p.status AS product_status
        FROM cart_items ci
        JOIN product_variants pv ON ci.product_variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        WHERE ci.user_id = ?
        ORDER BY ci.product_variant_id ASC
      `,
      [userId],
    );

    if (cartItems.length === 0) {
      throw new AppError("Cart is empty", 400);
    }

    // 2. Kiểm tra sản phẩm / variant / tồn kho (số liệu đã được khóa nên là số mới nhất)
    for (const item of cartItems) {
      if (item.variant_status !== "active") {
        throw new AppError(`Product variant ${item.sku} is not available`, 400);
      }

      if (item.product_status !== "active") {
        throw new AppError(
          `Product ${item.product_name} is not available`,
          400,
        );
      }

      if (item.quantity > item.stock) {
        throw new AppError(
          `Only ${item.stock} items available for ${item.product_name}`,
          400,
        );
      }
    }

    // 3. Tính subtotal từ giá trong DB (không bao giờ tin giá do client gửi)
    const subtotal = Math.round(
      cartItems.reduce(
        (total, item) => total + Number(item.price) * item.quantity,
        0,
      ),
    );

    // 4. Địa chỉ phải thuộc về user
    const [addresses] = await connection.query(
      `
        SELECT
          id, recipient_name, phone, province, district, ward, address_line
        FROM addresses
        WHERE id = ? AND user_id = ?
      `,
      [addressId, userId],
    );

    if (addresses.length === 0) {
      throw new AppError("Address not found", 404);
    }

    const address = addresses[0];

    // 5. Coupon: kiểm tra + khóa NGAY TRONG transaction (đủ status, ngày, đơn tối thiểu, usage_limit)
    let discountAmount = 0;
    let coupon = null;

    if (couponCode) {
      coupon = await validateCoupon(couponCode, subtotal, connection, {
        lock: true,
      });
      discountAmount = coupon.discountAmount;
    }

    // 6. Tổng tiền (không bao giờ âm)
    const shippingFee = SHIPPING_FEE;
    const totalAmount = Math.max(subtotal - discountAmount + shippingFee, 0);

    // 7. Tạo đơn
    const orderCode = generateOrderCode();

    const [orderResult] = await connection.query(
      `
        INSERT INTO orders (
          order_code, user_id, subtotal, discount_amount, shipping_fee, total_amount,
          status, payment_status, payment_method,
          shipping_recipient_name, shipping_phone, shipping_province,
          shipping_district, shipping_ward, shipping_address_line,
          coupon_code, note
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

    // 8. Trừ kho + ghi sổ kho + tạo order_items
    for (const item of cartItems) {
      // "AND stock >= ?" là lớp bảo vệ thứ 2: dù logic phía trên sai, kho cũng không thể âm
      const [updateResult] = await connection.query(
        `
          UPDATE product_variants
          SET stock = stock - ?
          WHERE id = ? AND stock >= ?
        `,
        [item.quantity, item.product_variant_id, item.quantity],
      );

      if (updateResult.affectedRows === 0) {
        throw new AppError(`Not enough stock for ${item.product_name}`, 400);
      }

      await connection.query(
        `
          INSERT INTO inventory_transactions (
            product_variant_id, type, quantity, reference_type, reference_id, note
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

      await connection.query(
        `
          INSERT INTO order_items (
            order_id, product_id, product_variant_id, product_name,
            variant_attributes, sku, price_at_purchase, quantity, subtotal
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
          Math.round(Number(item.price) * item.quantity),
        ],
      );
    }

    // 9. Payment
    await connection.query(
      `
        INSERT INTO payments (order_id, provider, amount, status)
        VALUES (?, ?, ?, ?)
      `,
      [orderId, paymentMethod, totalAmount, "pending"],
    );

    // 10. Tăng lượt dùng coupon (dòng coupon đã được khóa ở bước 5)
    if (coupon) {
      await connection.query(
        `UPDATE coupons SET used_count = used_count + 1 WHERE id = ?`,
        [coupon.couponId],
      );
    }

    // 11. Xóa giỏ
    await connection.query(`DELETE FROM cart_items WHERE user_id = ?`, [
      userId,
    ]);

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
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
