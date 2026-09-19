import pool from "../config/database.js";
import AppError from "../utils/AppError.js";

export const addToCart = async (userId, { productVariantId, quantity }) => {
  // 1. Kiểm tra variant tồn tại
  const [variants] = await pool.query(
    `
      SELECT id, product_id, price, stock, status
      FROM product_variants
      WHERE id = ?
    `,
    [productVariantId],
  );

  if (variants.length === 0) {
    throw new AppError("Product variant not found", 404);
  }

  const variant = variants[0];

  // 2. Kiểm tra variant có đang bán không
  if (variant.status !== "active") {
    throw new AppError("Product variant is not available", 400);
  }

  // 3. Kiểm tra variant đã có trong cart chưa
  const [existingItems] = await pool.query(
    `
      SELECT id, quantity
      FROM cart_items
      WHERE user_id = ?
      AND product_variant_id = ?
    `,
    [userId, productVariantId],
  );

  if (existingItems.length > 0) {
    // Đã có → cộng thêm quantity
    const newQuantity = existingItems[0].quantity + quantity;

    // 4. Kiểm tra stock
    if (newQuantity > variant.stock) {
      throw new AppError(`Only ${variant.stock} items available`, 400);
    }

    await pool.query(
      `
        UPDATE cart_items
        SET quantity = ?
        WHERE id = ?
      `,
      [newQuantity, existingItems[0].id],
    );

    return {
      id: existingItems[0].id,
      productVariantId,
      quantity: newQuantity,
    };
  }

  // 5. Chưa có → kiểm tra stock
  if (quantity > variant.stock) {
    throw new AppError(`Only ${variant.stock} items available`, 400);
  }

  // 6. Thêm item mới
  const [result] = await pool.query(
    `
      INSERT INTO cart_items
      (
        user_id,
        product_variant_id,
        quantity
      )
      VALUES (?, ?, ?)
    `,
    [userId, productVariantId, quantity],
  );

  return {
    id: result.insertId,
    productVariantId,
    quantity,
  };
};

export const getCart = async (userId) => {
  const [items] = await pool.query(
    `
      SELECT
        ci.id,
        ci.product_variant_id,
        ci.quantity,

        p.id AS product_id,
        p.name AS product_name,
        p.slug AS product_slug,

        pv.sku,
        pv.price,
        pv.stock,
        pv.attributes

      FROM cart_items ci

      JOIN product_variants pv
        ON ci.product_variant_id = pv.id

      JOIN products p
        ON pv.product_id = p.id

      WHERE ci.user_id = ?

      ORDER BY ci.id DESC
    `,
    [userId],
  );

  return items;
};

export const updateCartItem = async (userId, cartItemId, { quantity }) => {
  const [items] = await pool.query(
    `
      SELECT
        ci.id,
        ci.product_variant_id,
        pv.stock
      FROM cart_items ci
      JOIN product_variants pv
        ON ci.product_variant_id = pv.id
      WHERE ci.id = ?
      AND ci.user_id = ?
    `,
    [cartItemId, userId],
  );

  if (items.length === 0) {
    throw new AppError("Cart item not found", 404);
  }

  const item = items[0];

  if (quantity > item.stock) {
    throw new AppError(`Only ${item.stock} items available`, 400);
  }

  await pool.query(
    `
      UPDATE cart_items
      SET quantity = ?
      WHERE id = ?
      AND user_id = ?
    `,
    [quantity, cartItemId, userId],
  );

  return {
    id: Number(cartItemId),
    productVariantId: item.product_variant_id,
    quantity,
  };
};

export const removeCartItem = async (userId, cartItemId) => {
  const [items] = await pool.query(
    `
      SELECT id
      FROM cart_items
      WHERE id = ?
      AND user_id = ?
    `,
    [cartItemId, userId],
  );

  if (items.length === 0) {
    throw new AppError("Cart item not found", 404);
  }

  await pool.query(
    `
      DELETE FROM cart_items
      WHERE id = ?
      AND user_id = ?
    `,
    [cartItemId, userId],
  );
};

export const clearCart = async (userId) => {
  await pool.query(
    `
      DELETE FROM cart_items
      WHERE user_id = ?
    `,
    [userId],
  );
};