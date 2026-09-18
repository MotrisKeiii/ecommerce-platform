import pool from "../config/database.js";
import AppError from "../utils/AppError.js";

export const createProduct = async ({
  name,
  slug,
  description,
  brandId,
  categoryId,
  status,
}) => {
  const [brands] = await pool.query(
    `
      SELECT id
      FROM brands
      WHERE id = ?
    `,
    [brandId],
  );

  if (brands.length === 0) {
    throw new AppError("Brand not found", 404);
  }
  const [categories] = await pool.query(
    `
      SELECT id
      FROM categories
      WHERE id = ?
    `,
    [categoryId],
  );

  if (categories.length === 0) {
    throw new AppError("Category not found", 404);
  }
  const [existingProducts] = await pool.query(
    `
      SELECT id
      FROM products
      WHERE name = ? OR slug = ?
    `,
    [name, slug],
  );

  if (existingProducts.length > 0) {
    throw new AppError("Product name or slug already exists", 409);
  }
  const [result] = await pool.query(
    `
      INSERT INTO products
        (
          name,
          slug,
          description,
          brand_id,
          category_id,
          status
        )
      VALUES
        (?, ?, ?, ?, ?, ?)
    `,
    [name, slug, description || null, brandId, categoryId, status || "draft"],
  );

  return {
    id: result.insertId,
    name,
    slug,
    description: description || null,
    brandId,
    categoryId,
    status: status || "draft",
  };
};

export const getProducts = async () => {
  const [products] = await pool.query(
    `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.brand_id,
        b.name AS brand_name,
        p.category_id,
        c.name AS category_name,
        p.status,
        p.created_at,
        p.updated_at
      FROM products p
      JOIN brands b ON p.brand_id = b.id
      JOIN categories c ON p.category_id = c.id
      ORDER BY p.id DESC
    `,
  );

  return products;
};

export const getProductById = async (id) => {
  const [products] = await pool.query(
    `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.brand_id,
        b.name AS brand_name,
        p.category_id,
        c.name AS category_name,
        p.status,
        p.created_at,
        p.updated_at
      FROM products p
      JOIN brands b ON p.brand_id = b.id
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `,
    [id],
  );

  if (products.length === 0) {
    throw new AppError("Product not found", 404);
  }

  return products[0];
};

export const updateProduct = async (
  id,
  { name, slug, description, brandId, categoryId, status },
) => {
  // Kiểm tra Product
  const [products] = await pool.query(
    `
      SELECT id
      FROM products
      WHERE id = ?
    `,
    [id],
  );

  if (products.length === 0) {
    throw new AppError("Product not found", 404);
  }

  // Kiểm tra Brand
  const [brands] = await pool.query(
    `
      SELECT id
      FROM brands
      WHERE id = ?
    `,
    [brandId],
  );

  if (brands.length === 0) {
    throw new AppError("Brand not found", 404);
  }

  // Kiểm tra Category
  const [categories] = await pool.query(
    `
      SELECT id
      FROM categories
      WHERE id = ?
    `,
    [categoryId],
  );

  if (categories.length === 0) {
    throw new AppError("Category not found", 404);
  }

  // Kiểm tra trùng
  const [existingProducts] = await pool.query(
    `
      SELECT id
      FROM products
      WHERE (name = ? OR slug = ?)
      AND id != ?
    `,
    [name, slug, id],
  );

  if (existingProducts.length > 0) {
    throw new AppError("Product name or slug already exists", 409);
  }

  await pool.query(
    `
      UPDATE products
      SET
        name = ?,
        slug = ?,
        description = ?,
        brand_id = ?,
        category_id = ?,
        status = ?
      WHERE id = ?
    `,
    [name, slug, description || null, brandId, categoryId, status, id],
  );

  return {
    id: Number(id),
    name,
    slug,
    description: description || null,
    brandId,
    categoryId,
    status,
  };
};

export const deleteProduct = async (id) => {
  const [products] = await pool.query(
    `
      SELECT id
      FROM products
      WHERE id = ?
    `,
    [id],
  );

  if (products.length === 0) {
    throw new AppError("Product not found", 404);
  }

  try {
    await pool.query(
      `
        DELETE FROM products
        WHERE id = ?
      `,
      [id],
    );
  } catch (error) {
    throw new AppError("Cannot delete product because it is being used", 409);
  }
};