import pool from "../config/database.js";

export const getCurrentUser = async (userId) => {
  const [users] = await pool.query(
    `
      SELECT id, name, email, phone, role, status, created_at
      FROM users
      WHERE id = ?
    `,
    [userId],
  );

  if (users.length === 0) {
    throw new Error("User not found");
  }

  return users[0];
};
