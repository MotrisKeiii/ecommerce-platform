import pool from "../config/database.js";
import AppError from "../utils/AppError.js";
import { getPagination } from "../utils/pagination.js";

export const createInventoryTransaction = async ({
  productVariantId,
  type,
  quantity,
  note,
}) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

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
      [productVariantId],
    );

    if (variants.length === 0) {
      throw new AppError("Product variant not found", 404);
    }

    const variant = variants[0];

    if (variant.status !== "active") {
      throw new AppError("Product variant is not active", 400);
    }

    await connection.query(
      `
        UPDATE product_variants
        SET stock = stock + ?
        WHERE id = ?
      `,
      [quantity, productVariantId],
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
      [productVariantId, type, quantity, "admin", null, note || null],
    );

    await connection.commit();

    return {
      productVariantId,
      type,
      quantity,
      previousStock: variant.stock,
      newStock: variant.stock + quantity,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const getInventoryTransactions = async ({
  page = 1,
  limit = 10,
  type,
  productVariantId,
}) => {
  const {
    page: currentPage,
    limit: currentLimit,
    offset,
  } = getPagination(page, limit);

  const conditions = [];
  const params = [];

  if (type) {
    conditions.push("it.type = ?");
    params.push(type);
  }

  if (productVariantId) {
    conditions.push("it.product_variant_id = ?");
    params.push(productVariantId);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [transactions] = await pool.query(
    `
      SELECT
        it.id,
        it.product_variant_id,

        pv.sku,

        p.id AS product_id,
        p.name AS product_name,

        it.type,
        it.quantity,
        it.reference_type,
        it.reference_id,
        it.note,
        it.created_at

      FROM inventory_transactions it

      JOIN product_variants pv
        ON it.product_variant_id = pv.id

      JOIN products p
        ON pv.product_id = p.id

      ${whereClause}

      ORDER BY it.created_at DESC

      LIMIT ? OFFSET ?
    `,
    [...params, currentLimit, offset],
  );

  const [countResult] = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM inventory_transactions it
      ${whereClause}
    `,
    params,
  );

  const total = countResult[0].total;

  return {
    transactions,
    pagination: {
      page: currentPage,
      limit: currentLimit,
      total,
      totalPages: Math.ceil(total / currentLimit),
    },
  };
};