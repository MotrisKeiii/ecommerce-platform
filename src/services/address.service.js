import pool from "../config/database.js";
import AppError from "../utils/AppError.js";

export const createAddress = async (
  userId,
  { recipientName, phone, province, district, ward, addressLine, isDefault },
) => {
  // Nếu địa chỉ mới là default
  // thì bỏ default của các địa chỉ cũ
  if (isDefault) {
    await pool.query(
      `
        UPDATE addresses
        SET is_default = 0
        WHERE user_id = ?
      `,
      [userId],
    );
  }

  const [result] = await pool.query(
    `
      INSERT INTO addresses
      (
        user_id,
        recipient_name,
        phone,
        province,
        district,
        ward,
        address_line,
        is_default
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      userId,
      recipientName,
      phone,
      province,
      district,
      ward,
      addressLine,
      isDefault ?? false,
    ],
  );

  return {
    id: result.insertId,
    userId,
    recipientName,
    phone,
    province,
    district,
    ward,
    addressLine,
    isDefault: isDefault ?? false,
  };
};

export const getAddresses = async (userId) => {
  const [addresses] = await pool.query(
    `
      SELECT
        id,
        user_id,
        recipient_name,
        phone,
        province,
        district,
        ward,
        address_line,
        is_default,
        created_at,
        updated_at
      FROM addresses
      WHERE user_id = ?
      ORDER BY is_default DESC, id DESC
    `,
    [userId],
  );

  return addresses;
};

export const getAddressById = async (userId, addressId) => {
  const [addresses] = await pool.query(
    `
      SELECT
        id,
        user_id,
        recipient_name,
        phone,
        province,
        district,
        ward,
        address_line,
        is_default,
        created_at,
        updated_at
      FROM addresses
      WHERE id = ?
      AND user_id = ?
    `,
    [addressId, userId],
  );

  if (addresses.length === 0) {
    throw new AppError("Address not found", 404);
  }

  return addresses[0];
};

export const updateAddress = async (userId, addressId, data) => {
  const [addresses] = await pool.query(
    `
      SELECT
        id,
        user_id,
        recipient_name,
        phone,
        province,
        district,
        ward,
        address_line,
        is_default
      FROM addresses
      WHERE id = ?
      AND user_id = ?
    `,
    [addressId, userId],
  );

  if (addresses.length === 0) {
    throw new AppError("Address not found", 404);
  }

  const currentAddress = addresses[0];

  const updatedAddress = {
    recipientName: data.recipientName ?? currentAddress.recipient_name,

    phone: data.phone ?? currentAddress.phone,

    province: data.province ?? currentAddress.province,

    district: data.district ?? currentAddress.district,

    ward: data.ward ?? currentAddress.ward,

    addressLine: data.addressLine ?? currentAddress.address_line,

    isDefault: data.isDefault ?? Boolean(currentAddress.is_default),
  };

  if (updatedAddress.isDefault) {
    await pool.query(
      `
        UPDATE addresses
        SET is_default = 0
        WHERE user_id = ?
        AND id != ?
      `,
      [userId, addressId],
    );
  }

  await pool.query(
    `
      UPDATE addresses
      SET
        recipient_name = ?,
        phone = ?,
        province = ?,
        district = ?,
        ward = ?,
        address_line = ?,
        is_default = ?
      WHERE id = ?
      AND user_id = ?
    `,
    [
      updatedAddress.recipientName,
      updatedAddress.phone,
      updatedAddress.province,
      updatedAddress.district,
      updatedAddress.ward,
      updatedAddress.addressLine,
      updatedAddress.isDefault,
      addressId,
      userId,
    ],
  );

  return {
    id: Number(addressId),
    userId,
    ...updatedAddress,
  };
};

export const deleteAddress = async (userId, addressId) => {
  const [addresses] = await pool.query(
    `
      SELECT id
      FROM addresses
      WHERE id = ?
      AND user_id = ?
    `,
    [addressId, userId],
  );

  if (addresses.length === 0) {
    throw new AppError("Address not found", 404);
  }

  await pool.query(
    `
      DELETE FROM addresses
      WHERE id = ?
      AND user_id = ?
    `,
    [addressId, userId],
  );
};