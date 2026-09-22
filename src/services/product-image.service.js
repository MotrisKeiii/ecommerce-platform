import pool from "../config/database.js";
import AppError from "../utils/AppError.js";
import cloudinary from "../config/cloudinary.js";

export const createProductImage = async ({
  productId,
  imageUrl,
  publicId,
  isPrimary = false,
  sortOrder = 0,
}) => {
  const [products] = await pool.query("SELECT id FROM products WHERE id = ?", [
    productId,
  ]);

  if (products.length === 0) {
    throw new AppError("Product not found", 404);
  }

  if (isPrimary) {
    await pool.query(
      "UPDATE product_images SET is_primary = 0 WHERE product_id = ?",
      [productId],
    );
  }
  const [result] = await pool.query(
    `
    INSERT INTO product_images
    (product_id, image_url, public_id, is_primary, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `,
    [productId, imageUrl, publicId, isPrimary, sortOrder],
  );

  const [images] = await pool.query(
    "SELECT * FROM product_images WHERE id = ?",
    [result.insertId],
  );

  return images[0];
};

export const getProductImages = async (productId) => {
  const [products] = await pool.query("SELECT id FROM products WHERE id = ?", [
    productId,
  ]);

  if (products.length === 0) {
    throw new AppError("Product not found", 404);
  }

  const [images] = await pool.query(
    `
      SELECT *
      FROM product_images
      WHERE product_id = ?
      ORDER BY sort_order ASC, id ASC
    `,
    [productId],
  );

  return images;
};

export const getProductImageById = async (id) => {
  const [images] = await pool.query(
    `
      SELECT
        id,
        product_id,
        image_url,
        is_primary,
        sort_order,
        created_at
      FROM product_images
      WHERE id = ?
    `,
    [id],
  );

  if (images.length === 0) {
    throw new AppError("Product image not found", 404);
  }

  return images[0];
};

export const updateProductImage = async (id, data) => {
  const [images] = await pool.query(
    `
      SELECT
        id,
        product_id,
        image_url,
        is_primary,
        sort_order
      FROM product_images
      WHERE id = ?
    `,
    [id],
  );

  if (images.length === 0) {
    throw new AppError("Product image not found", 404);
  }

  const currentImage = images[0];

  const updatedImage = {
    imageUrl: data.imageUrl ?? currentImage.image_url,
    isPrimary: data.isPrimary ?? Boolean(currentImage.is_primary),
    sortOrder: data.sortOrder ?? currentImage.sort_order,
  };

  // Nếu ảnh này được đặt làm primary
  if (updatedImage.isPrimary) {
    await pool.query(
      `
        UPDATE product_images
        SET is_primary = 0
        WHERE product_id = ?
        AND id != ?
      `,
      [currentImage.product_id, id],
    );
  }

  await pool.query(
    `
      UPDATE product_images
      SET
        image_url = ?,
        is_primary = ?,
        sort_order = ?
      WHERE id = ?
    `,
    [updatedImage.imageUrl, updatedImage.isPrimary, updatedImage.sortOrder, id],
  );

  return {
    id: Number(id),
    productId: currentImage.product_id,
    imageUrl: updatedImage.imageUrl,
    isPrimary: updatedImage.isPrimary,
    sortOrder: updatedImage.sortOrder,
  };
};

export const deleteProductImage = async (id) => {
  const [images] = await pool.query(
    `
      SELECT
        id,
        product_id,
        public_id,
        is_primary
      FROM product_images
      WHERE id = ?
    `,
    [id],
  );

  if (images.length === 0) {
    throw new AppError("Product image not found", 404);
  }

  const image = images[0];

  if (image.public_id) {
    await cloudinary.uploader.destroy(image.public_id, {
      resource_type: "image",
    });
  }

  await pool.query(
    `
      DELETE FROM product_images
      WHERE id = ?
    `,
    [id],
  );
};
