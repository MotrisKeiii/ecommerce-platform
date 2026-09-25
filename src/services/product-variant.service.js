import pool from "../config/database.js";
import AppError from "../utils/AppError.js";

export const createProductVariant = async ({
  productId,
  sku,
  price,
  compareAtPrice,
  stock,
  attributes,
  status,
}) => {
  const [products] = await pool.query(
    `
      SELECT id
      FROM products
      WHERE id = ?
    `,
    [productId],
  );

  if (products.length === 0) {
    throw new AppError("Product not found", 404);
  }
  const [existingVariants] = await pool.query(
    `
      SELECT id
      FROM product_variants
      WHERE sku = ?
    `,
    [sku],
  );

  if (existingVariants.length > 0) {
    throw new AppError("SKU already exists", 409);
  }
  const [result] = await pool.query(
    `
      INSERT INTO product_variants
      (
        product_id,
        sku,
        price,
        compare_at_price,
        stock,
        attributes,
        status
      )
      VALUES
      (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      productId,
      sku,
      price,
      compareAtPrice ?? null,
      stock,
      attributes ? JSON.stringify(attributes) : null,
      status || "active",
    ],
  );

  return {
    id: result.insertId,
    productId,
    sku,
    price,
    compareAtPrice: compareAtPrice ?? null,
    stock,
    attributes: attributes ?? null,
    status: status || "active",
  };
};

export const getProductVariants = async (productId, includeHidden = false) => {
  const [variants] = await pool.query(
    `
      SELECT
        pv.id, pv.product_id, pv.sku, pv.price, pv.compare_at_price,
        pv.stock, pv.attributes, pv.status, pv.created_at, pv.updated_at
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.product_id = ?
      ${includeHidden ? "" : "AND pv.status = 'active' AND p.status = 'active'"}
      ORDER BY pv.id DESC
    `,
    [productId],
  );

  return variants;
};

export const getProductVariantById = async (id, includeHidden = false) => {
  const [variants] = await pool.query(
    `
      SELECT
        pv.id, pv.product_id, pv.sku, pv.price, pv.compare_at_price,
        pv.stock, pv.attributes, pv.status, pv.created_at, pv.updated_at
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.id = ?
      ${includeHidden ? "" : "AND pv.status = 'active' AND p.status = 'active'"}
    `,
    [id],
  );

  if (variants.length === 0) {
    throw new AppError("Product variant not found", 404);
  }

  return variants[0];
};

export const updateProductVariant = async (id, data) => {
  const [variants] = await pool.query(
    `
      SELECT
        id,
        sku,
        price,
        compare_at_price,
        stock,
        attributes,
        status
      FROM product_variants
      WHERE id = ?
    `,
    [id],
  );

  if (variants.length === 0) {
    throw new AppError("Product variant not found", 404);
  }

  const currentVariant = variants[0];

  const updatedVariant = {
    sku: data.sku ?? currentVariant.sku,
    price: data.price ?? currentVariant.price,
    compareAtPrice: data.compareAtPrice ?? currentVariant.compare_at_price,
    stock: data.stock ?? currentVariant.stock,
    attributes: data.attributes ?? currentVariant.attributes,
    status: data.status ?? currentVariant.status,
  };

  const [existingVariants] = await pool.query(
    `
      SELECT id
      FROM product_variants
      WHERE sku = ?
      AND id != ?
    `,
    [updatedVariant.sku, id],
  );

  if (existingVariants.length > 0) {
    throw new AppError("SKU already exists", 409);
  }

  await pool.query(
    `
      UPDATE product_variants
      SET
        sku = ?,
        price = ?,
        compare_at_price = ?,
        stock = ?,
        attributes = ?,
        status = ?
      WHERE id = ?
    `,
    [
      updatedVariant.sku,
      updatedVariant.price,
      updatedVariant.compareAtPrice,
      updatedVariant.stock,
      typeof updatedVariant.attributes === "object"
        ? JSON.stringify(updatedVariant.attributes)
        : updatedVariant.attributes,
      updatedVariant.status,
      id,
    ],
  );

  return {
    id: Number(id),
    sku: updatedVariant.sku,
    price: updatedVariant.price,
    compareAtPrice: updatedVariant.compareAtPrice,
    stock: updatedVariant.stock,
    attributes: updatedVariant.attributes,
    status: updatedVariant.status,
  };
};

export const deleteProductVariant = async (id) => {
  const [variants] = await pool.query(
    `
      SELECT id
      FROM product_variants
      WHERE id = ?
    `,
    [id],
  );

  if (variants.length === 0) {
    throw new AppError("Product variant not found", 404);
  }

  try {
    await pool.query(
      `
        DELETE FROM product_variants
        WHERE id = ?
      `,
      [id],
    );
  } catch (error) {
    throw new AppError(
      "Cannot delete product variant because it is being used",
      409,
    );
  }
};
