import pool from "../config/database.js";
import AppError from "../utils/AppError.js";

export const addToWishlist = async (userId, productId) => {
  // 1. Kiểm tra product có tồn tại không
  const [products] = await pool.query(
    `
      SELECT id
      FROM products
      WHERE id = ?
      AND status = 'active'
    `,
    [productId],
  );

  if (products.length === 0) {
    throw new AppError("Product not found", 404);
  }

  // 2. Kiểm tra product đã có trong wishlist chưa
  const [existingItems] = await pool.query(
    `
      SELECT id
      FROM wishlist_items
      WHERE user_id = ?
      AND product_id = ?
    `,
    [userId, productId],
  );

  if (existingItems.length > 0) {
    throw new AppError("Product already in wishlist", 409);
  }

  // 3. Thêm vào wishlist
  const [result] = await pool.query(
    `
      INSERT INTO wishlist_items
      (
        user_id,
        product_id
      )
      VALUES (?, ?)
    `,
    [userId, productId],
  );

  return {
    id: result.insertId,
    userId,
    productId,
  };
};

export const getWishlist = async (userId) => {
  const [items] = await pool.query(
    `
      SELECT
        wi.id,
        wi.product_id,

        p.name,
        p.slug,
        p.description,
        p.brand_id,
        b.name AS brand_name,
        p.category_id,
        c.name AS category_name,
        p.status,

        wi.created_at

      FROM wishlist_items wi

      JOIN products p
        ON wi.product_id = p.id

      JOIN brands b
        ON p.brand_id = b.id

      JOIN categories c
        ON p.category_id = c.id

      WHERE wi.user_id = ?

      ORDER BY wi.created_at DESC
    `,
    [userId],
  );

  return items;
};

export const removeFromWishlist = async (userId, productId) => {
  const [items] = await pool.query(
    `
      SELECT id
      FROM wishlist_items
      WHERE user_id = ?
      AND product_id = ?
    `,
    [userId, productId],
  );

  if (items.length === 0) {
    throw new AppError("Product is not in wishlist", 404);
  }

  await pool.query(
    `
      DELETE FROM wishlist_items
      WHERE user_id = ?
      AND product_id = ?
    `,
    [userId, productId],
  );
};