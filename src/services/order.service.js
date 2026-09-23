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

export const updateOrderStatus = async (orderId, nextStatus) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [orders] = await connection.query(
      `
        SELECT
          id,
          status
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

    const canTransition = canTransitionOrderStatus(order.status, nextStatus);

    if (!canTransition) {
      throw new AppError(
        `Cannot change order status from ${order.status} to ${nextStatus}`,
        400,
      );
    }

    if (newStatus === "cancelled" || newStatus === "returned") {
      const inventoryType = newStatus === "returned" ? "return" : "adjustment";

      const inventoryNote =
        newStatus === "returned"
          ? "Stock restored because order was returned"
          : "Stock restored because order was cancelled";

      await restoreOrderStock(
        connection,
        orderId,
        inventoryType,
        inventoryNote,
      );
    }

    await connection.query(
      `
        UPDATE orders
        SET status = ?
        WHERE id = ?
      `,
      [nextStatus, orderId],
    );

    await connection.commit();

    return {
      id: order.id,
      previousStatus: order.status,
      status: nextStatus,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
