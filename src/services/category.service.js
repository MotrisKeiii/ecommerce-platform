import pool from "../config/database.js";
import AppError from "../utils/AppError.js";

export const createCategory = async ({ name, slug, parentId }) => {
  // Nếu có parentId thì kiểm tra category cha có tồn tại không
  if (parentId !== null && parentId !== undefined) {
    const [parentCategories] = await pool.query(
      `
        SELECT id
        FROM categories
        WHERE id = ?
      `,
      [parentId],
    );

    if (parentCategories.length === 0) {
      throw new AppError("Parent category not found", 404);
    }
  }

  // Kiểm tra name hoặc slug đã tồn tại
  const [existingCategories] = await pool.query(
    `
      SELECT id
      FROM categories
      WHERE name = ? OR slug = ?
    `,
    [name, slug],
  );

  if (existingCategories.length > 0) {
    throw new AppError("Category name or slug already exists", 409);
  }

  const [result] = await pool.query(
    `
      INSERT INTO categories
        (name, slug, parent_id)
      VALUES
        (?, ?, ?)
    `,
    [name, slug, parentId || null],
  );

  return {
    id: result.insertId,
    name,
    slug,
    parentId: parentId || null,
  };
};

export const getCategories = async () => {
  const [categories] = await pool.query(
    `
      SELECT id, name, slug, parent_id, created_at, updated_at
      FROM categories
      ORDER BY id DESC
    `,
  );

  return categories;
};

export const getCategoryById = async (id) => {
  const [categories] = await pool.query(
    `
      SELECT id, name, slug, parent_id, created_at, updated_at
      FROM categories
      WHERE id = ?
    `,
    [id],
  );

  if (categories.length === 0) {
    throw new AppError("Category not found", 404);
  }

  return categories[0];
};

export const updateCategory = async (id, { name, slug, parentId }) => {
  // 1. Kiểm tra category cần sửa có tồn tại
  const [categories] = await pool.query(
    `
      SELECT id
      FROM categories
      WHERE id = ?
    `,
    [id],
  );

  if (categories.length === 0) {
    throw new AppError("Category not found", 404);
  }

  // 2. Không cho category làm parent của chính nó
  if (parentId !== null && parentId !== undefined) {
    if (Number(parentId) === Number(id)) {
      throw new AppError("Category cannot be its own parent", 400);
    }

    // 3. Parent phải tồn tại
    const [parentCategories] = await pool.query(
      `
        SELECT id
        FROM categories
        WHERE id = ?
      `,
      [parentId],
    );

    if (parentCategories.length === 0) {
      throw new AppError("Parent category not found", 404);
    }
  }

  // 4. Kiểm tra name / slug có bị category khác sử dụng không
  const [existingCategories] = await pool.query(
    `
      SELECT id
      FROM categories
      WHERE (name = ? OR slug = ?)
      AND id != ?
    `,
    [name, slug, id],
  );

  if (existingCategories.length > 0) {
    throw new AppError("Category name or slug already exists", 409);
  }

  // 5. Update
  await pool.query(
    `
      UPDATE categories
      SET name = ?, slug = ?, parent_id = ?
      WHERE id = ?
    `,
    [name, slug, parentId ?? null, id],
  );

  return {
    id: Number(id),
    name,
    slug,
    parentId: parentId ?? null,
  };
};

export const deleteCategory = async (id) => {
  const [categories] = await pool.query(
    `
      SELECT id
      FROM categories
      WHERE id = ?
    `,
    [id],
  );

  if (categories.length === 0) {
    throw new AppError("Category not found", 404);
  }

  try {
    await pool.query(
      `
        DELETE FROM categories
        WHERE id = ?
      `,
      [id],
    );
  } catch (error) {
    throw new AppError("Cannot delete category because it is being used", 409);
  }
};
