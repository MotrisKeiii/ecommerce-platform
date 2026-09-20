import pool from "../config/database.js";
import AppError from "../utils/AppError.js";
import { canTransitionOrderStatus } from "../utils/orderStatus.js";

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

    if (nextStatus === "cancelled" || nextStatus === "returned") {
      // =========================
      // 1. Restore stock
      // =========================

      const inventoryType = nextStatus === "returned" ? "return" : "adjustment";

      const inventoryNote =
        nextStatus === "returned"
          ? "Stock restored because order was returned"
          : "Stock restored because order was cancelled";

      const [items] = await connection.query(
        `
      SELECT
        product_variant_id,
        quantity
      FROM order_items
      WHERE order_id = ?
    `,
        [orderId],
      );

      for (const item of items) {
        await connection.query(
          `
        UPDATE product_variants
        SET stock = stock + ?
        WHERE id = ?
      `,
          [item.quantity, item.product_variant_id],
        );

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
            inventoryType,
            item.quantity,
            "order",
            orderId,
            inventoryNote,
          ],
        );
      }

      // =========================
      // 2. Refund payment
      // =========================

      const [payments] = await connection.query(
        `
      SELECT
        id,
        status,
        amount
      FROM payments
      WHERE order_id = ?
      FOR UPDATE
    `,
        [orderId],
      );

      if (payments.length > 0) {
        const payment = payments[0];

        if (payment.status === "success") {
          await connection.query(
            `
          UPDATE payments
          SET status = 'refunded'
          WHERE id = ?
        `,
            [payment.id],
          );

          await connection.query(
            `
          UPDATE orders
          SET payment_status = 'refunded'
          WHERE id = ?
        `,
            [orderId],
          );
        }
      }
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
