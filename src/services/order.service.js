import pool from "../config/database.js";
import AppError from "../utils/AppError.js";
import { canTransitionOrderStatus } from "../utils/orderStatus.js";
import { restoreOrderStock } from "./inventory.service.js";

export const getMyOrders = async (userId) => {
  const [orders] = await pool.query(
    `
      SELECT
        id,
        order_code,
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
        note,
        created_at,
        updated_at
      FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
    `,
    [userId],
  );

  return orders;
};

export const getMyOrderById = async (userId, orderId) => {
  const [orders] = await pool.query(
    `
      SELECT
        id,
        order_code,
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
        note,
        created_at,
        updated_at
      FROM orders
      WHERE id = ?
      AND user_id = ?
    `,
    [orderId, userId],
  );

  if (orders.length === 0) {
    throw new AppError("Order not found", 404);
  }

  const order = orders[0];

  const [items] = await pool.query(
    `
      SELECT
        oi.id,
        oi.product_id,
        oi.product_variant_id,
        oi.product_name,
        oi.variant_attributes,
        oi.sku,
        oi.price_at_purchase,
        oi.quantity,
        oi.subtotal,
        oi.created_at
      FROM order_items oi
      WHERE oi.order_id = ?
      ORDER BY oi.id ASC
    `,
    [orderId],
  );

  return {
    ...order,
    items,
  };
};

/**
 * Đổi trạng thái đơn TRONG một transaction có sẵn (connection do nơi gọi mở).
 * Dùng chung cho: admin đổi trạng thái, thanh toán thất bại...
 *
 * Vì sao hoàn kho chỉ xảy ra 1 lần (idempotent)?
 *  - Khóa dòng order bằng FOR UPDATE -> 2 request cùng lúc phải xếp hàng.
 *  - cancelled/returned là trạng thái cuối (không có đường đi ra) nên request thứ 2
 *    sẽ bị canTransitionOrderStatus() từ chối -> không thể cộng kho lần nữa.
 */
export const changeOrderStatusInTransaction = async (
  connection,
  orderId,
  nextStatus,
  { note } = {},
) => {
  const [orders] = await connection.query(
    `
      SELECT id, status, coupon_code
      FROM orders
      WHERE id = ?
      FOR UPDATE
    `,
    [orderId],
  );

  if (orders.length === 0) {
    throw new AppError("Order not found", 404);
  }

  const order = orders[0];

  if (!canTransitionOrderStatus(order.status, nextStatus)) {
    throw new AppError(
      `Cannot change order status from ${order.status} to ${nextStatus}`,
      400,
    );
  }

  if (nextStatus === "cancelled" || nextStatus === "returned") {
    const isReturn = nextStatus === "returned";

    await restoreOrderStock(
      connection,
      orderId,
      isReturn ? "return" : "adjustment",
      note ||
        (isReturn
          ? "Stock restored because order was returned"
          : "Stock restored because order was cancelled"),
    );
  }

  // Hủy đơn -> trả lại lượt dùng coupon (đơn trả hàng thì coupon đã được dùng thật nên không trả)
  if (nextStatus === "cancelled" && order.coupon_code) {
    await connection.query(
      `
        UPDATE coupons
        SET used_count = GREATEST(used_count - 1, 0)
        WHERE code = ?
      `,
      [order.coupon_code],
    );
  }

  await connection.query(`UPDATE orders SET status = ? WHERE id = ?`, [
    nextStatus,
    orderId,
  ]);

  return { id: order.id, previousStatus: order.status, status: nextStatus };
};

export const updateOrderStatus = async (orderId, nextStatus) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const result = await changeOrderStatusInTransaction(
      connection,
      orderId,
      nextStatus,
    );

    await connection.commit();

    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
