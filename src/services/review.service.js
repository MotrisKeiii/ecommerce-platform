import pool from "../config/database.js";
import AppError from "../utils/AppError.js";

export const createReview = async (
  userId,
  { productId, orderItemId, rating, comment },
) => {
  // 1. Kiểm tra order item có tồn tại,
  //    thuộc user hiện tại và đúng product
  const [orderItems] = await pool.query(
    `
      SELECT
        oi.id,
        oi.order_id,
        oi.product_id,
        o.user_id,
        o.status
      FROM order_items oi
      JOIN orders o
        ON oi.order_id = o.id
      WHERE oi.id = ?
      AND o.user_id = ?
      AND oi.product_id = ?
    `,
    [orderItemId, userId, productId],
  );

  if (orderItems.length === 0) {
    throw new AppError("You cannot review this product", 403);
  }

  const orderItem = orderItems[0];

  // 2. Chỉ được review khi order đã giao
  if (orderItem.status !== "delivered") {
    throw new AppError("You can only review a delivered order", 400);
  }

  // 3. Kiểm tra đã review order item này chưa
  const [existingReviews] = await pool.query(
    `
      SELECT id
      FROM reviews
      WHERE user_id = ?
      AND order_item_id = ?
    `,
    [userId, orderItemId],
  );

  if (existingReviews.length > 0) {
    throw new AppError("You have already reviewed this item", 409);
  }

  // 4. Tạo review
  const [result] = await pool.query(
    `
      INSERT INTO reviews
      (
        user_id,
        product_id,
        order_item_id,
        rating,
        comment,
        status
      )
      VALUES (?, ?, ?, ?, ?, 'pending')
    `,
    [userId, productId, orderItemId, rating, comment || null],
  );

  return {
    id: result.insertId,
    userId,
    productId,
    orderItemId,
    rating,
    comment: comment || null,
    status: "pending",
  };
};

export const getReviewsByProduct = async (productId) => {
  const [reviews] = await pool.query(
    `
      SELECT
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        u.id AS user_id,
        u.name AS user_name
      FROM reviews r
      JOIN users u
        ON r.user_id = u.id
      WHERE r.product_id = ?
      AND r.status = 'approved'
      ORDER BY r.created_at DESC
    `,
    [productId],
  );

  return reviews;
};

export const getMyReviews = async (userId) => {
  const [reviews] = await pool.query(
    `
      SELECT
        r.id,
        r.product_id,
        p.name AS product_name,
        r.order_item_id,
        r.rating,
        r.comment,
        r.status,
        r.created_at,
        r.updated_at
      FROM reviews r
      JOIN products p
        ON r.product_id = p.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `,
    [userId],
  );

  return reviews;
};

export const updateReview = async (userId, reviewId, { rating, comment }) => {
  // 1. Tìm review và kiểm tra ownership
  const [reviews] = await pool.query(
    `
      SELECT
        id,
        user_id,
        rating,
        comment,
        status
      FROM reviews
      WHERE id = ?
      AND user_id = ?
    `,
    [reviewId, userId],
  );

  if (reviews.length === 0) {
    throw new AppError("Review not found", 404);
  }

  const currentReview = reviews[0];

  // 2. PATCH → giữ lại dữ liệu cũ nếu field không được gửi
  const updatedReview = {
    rating: rating ?? currentReview.rating,
    comment: comment ?? currentReview.comment,
  };

  // 3. Cập nhật review
  await pool.query(
    `
      UPDATE reviews
      SET
        rating = ?,
        comment = ?
      WHERE id = ?
      AND user_id = ?
    `,
    [updatedReview.rating, updatedReview.comment, reviewId, userId],
  );

  return {
    id: Number(reviewId),
    rating: updatedReview.rating,
    comment: updatedReview.comment,
  };
};

export const deleteReview = async (userId, reviewId) => {
  // 1. Kiểm tra review có tồn tại
  //    và thuộc user hiện tại hay không
  const [reviews] = await pool.query(
    `
      SELECT id
      FROM reviews
      WHERE id = ?
      AND user_id = ?
    `,
    [reviewId, userId],
  );

  if (reviews.length === 0) {
    throw new AppError("Review not found", 404);
  }

  // 2. Xóa review
  await pool.query(
    `
      DELETE FROM reviews
      WHERE id = ?
      AND user_id = ?
    `,
    [reviewId, userId],
  );
};

export const getAllReviews = async () => {
  const [reviews] = await pool.query(
    `
      SELECT
        r.id,
        r.product_id,
        p.name AS product_name,
        r.order_item_id,
        r.rating,
        r.comment,
        r.status,
        r.created_at,
        r.updated_at,
        u.id AS user_id,
        u.name AS user_name,
        u.email AS user_email
      FROM reviews r
      JOIN products p
        ON r.product_id = p.id
      JOIN users u
        ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `,
  );

  return reviews;
};

export const updateReviewStatus = async (reviewId, status) => {
  const [reviews] = await pool.query(
    `
      SELECT id
      FROM reviews
      WHERE id = ?
    `,
    [reviewId],
  );

  if (reviews.length === 0) {
    throw new AppError("Review not found", 404);
  }

  await pool.query(
    `
      UPDATE reviews
      SET status = ?
      WHERE id = ?
    `,
    [status, reviewId],
  );

  return {
    id: Number(reviewId),
    status,
  };
};