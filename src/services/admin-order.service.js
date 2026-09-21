import pool from "../config/database.js";
import { getPagination } from "../utils/pagination.js";
import AppError from "../utils/AppError.js";

export const getAllOrders = async ({
  page = 1,
  limit = 10,
  status,
  paymentStatus,
}) => {
  const pagination = getPagination(page, limit);

  const { page: currentPage, limit: currentLimit, offset } = pagination;
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push("o.status = ?");
    params.push(status);
  }

  if (paymentStatus) {
    conditions.push("o.payment_status = ?");
    params.push(paymentStatus);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [orders] = await pool.query(
    `
      SELECT
        o.id,
        o.order_code,
        o.user_id,
        u.name AS customer_name,
        u.email AS customer_email,
        o.subtotal,
        o.discount_amount,
        o.shipping_fee,
        o.total_amount,
        o.status,
        o.payment_status,
        o.payment_method,
        o.created_at
      FROM orders o
      JOIN users u
        ON o.user_id = u.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [...params, currentLimit, offset],
  );

  const [countResult] = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM orders o
      ${whereClause}
    `,
    params,
  );

  const total = countResult[0].total;

  return {
    orders,
    pagination: {
      page: currentPage,
      limit: currentLimit,
      total,
      totalPages: Math.ceil(total / currentLimit),
    },
  };
};

export const getOrderById = async (orderId) => {
  const [orders] = await pool.query(
    `
      SELECT
        o.id,
        o.order_code,
        o.user_id,

        u.name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,

        o.subtotal,
        o.discount_amount,
        o.shipping_fee,
        o.total_amount,

        o.status,
        o.payment_status,
        o.payment_method,

        o.shipping_recipient_name,
        o.shipping_phone,
        o.shipping_province,
        o.shipping_district,
        o.shipping_ward,
        o.shipping_address_line,

        o.coupon_code,
        o.note,

        o.created_at,
        o.updated_at
      FROM orders o
      JOIN users u
        ON o.user_id = u.id
      WHERE o.id = ?
    `,
    [orderId],
  );

  if (orders.length === 0) {
    throw new AppError("Order not found", 404);
  }

  const order = orders[0];

  const [items] = await pool.query(
    `
      SELECT
        id,
        product_id,
        product_variant_id,
        product_name,
        variant_attributes,
        sku,
        price_at_purchase,
        quantity,
        subtotal
      FROM order_items
      WHERE order_id = ?
      ORDER BY id ASC
    `,
    [orderId],
  );

  return {
    ...order,
    items,
  };
};