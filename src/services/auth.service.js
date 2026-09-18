import bcrypt from "bcrypt";
import pool from "../config/database.js";
import AppError from "../utils/AppError.js";

export const register = async ({ name, email, password, phone }) => {
  const [existingUsers] = await pool.query(
    "SELECT id FROM users WHERE email = ?",
    [email],
  );

  if (existingUsers.length > 0) {
    throw new AppError("Email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [result] = await pool.query(
    `
      INSERT INTO users
        (name, email, password_hash, phone)
      VALUES
        (?, ?, ?, ?)
    `,
    [name, email, passwordHash, phone || null],
  );

  return {
    id: result.insertId,
    name,
    email,
    phone: phone || null,
  };
};

export const login = async ({ email, password }) => {
  const [users] = await pool.query(
    `
      SELECT id, name, email, password_hash, phone, role, status
      FROM users
      WHERE email = ?
    `,
    [email],
  );

  if (users.length === 0) {
    throw new AppError("Invalid email or password", 401);
  }

  const user = users[0];

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  if (user.status !== "active") {
    throw new AppError("Account is not active", 403);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
};
