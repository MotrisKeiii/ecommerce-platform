import pool from "../config/database.js";
import AppError from "../utils/AppError.js";

export const createBrand = async ({ name, slug }) => {
  const [existingBrands] = await pool.query(
    `
      SELECT id
      FROM brands
      WHERE name = ? OR slug = ?
    `,
    [name, slug],
  );

  if (existingBrands.length > 0) {
    throw new AppError("Brand name or slug already exists", 409);
  }

  const [result] = await pool.query(
    `
      INSERT INTO brands (name, slug)
      VALUES (?, ?)
    `,
    [name, slug],
  );

  return {
    id: result.insertId,
    name,
    slug,
  };
};

export const getBrands = async () => {
  const [brands] = await pool.query(
    `
      SELECT id, name, slug, created_at, updated_at
      FROM brands
      ORDER BY id DESC
    `,
  );

  return brands;
};

export const getBrandById = async (id) => {
  const [brands] = await pool.query(
    `
      SELECT id, name, slug, created_at, updated_at
      FROM brands
      WHERE id = ?
    `,
    [id],
  );

  if (brands.length === 0) {
    throw new AppError("Brand not found", 404);
  }

  return brands[0];
};

export const updateBrand = async (id, { name, slug }) => {
  const [brands] = await pool.query(
    `
      SELECT id
      FROM brands
      WHERE id = ?
    `,
    [id],
  );

  if (brands.length === 0) {
    throw new AppError("Brand not found", 404);
  }

  const [existingBrands] = await pool.query(
    `
      SELECT id
      FROM brands
      WHERE (name = ? OR slug = ?)
      AND id != ?
    `,
    [name, slug, id],
  );

  if (existingBrands.length > 0) {
    throw new AppError("Brand name or slug already exists", 409);
  }

  await pool.query(
    `
      UPDATE brands
      SET name = ?, slug = ?
      WHERE id = ?
    `,
    [name, slug, id],
  );

  return {
    id: Number(id),
    name,
    slug,
  };
};

export const deleteBrand = async (id) => {
  const [brands] = await pool.query(
    `
      SELECT id
      FROM brands
      WHERE id = ?
    `,
    [id],
  );

  if (brands.length === 0) {
    throw new AppError("Brand not found", 404);
  }

  try {
    await pool.query(
      `
        DELETE FROM brands
        WHERE id = ?
      `,
      [id],
    );
  } catch (error) {
    throw new AppError(
      "Cannot delete brand because it is being used by products",
      409,
    );
  }
};