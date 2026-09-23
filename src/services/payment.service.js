import pool from "../config/database.js";
import AppError from "../utils/AppError.js";
import { restoreOrderStock } from "./inventory.service.js";

export const processMockPayment = async (userId, paymentId, success) => {
  const connection = await pool.getConnection();

  try {
    // Bắt đầu transaction
    await connection.beginTransaction();

    // 1. Tìm payment
    const [payments] = await connection.query(
      `
    SELECT
      p.id,
      p.order_id,
      p.amount,
      p.status,
      p.provider,
      o.user_id
    FROM payments p
    JOIN orders o ON p.order_id = o.id
    WHERE p.id = ?
      AND o.user_id = ?
    FOR UPDATE
  `,
      [paymentId, userId],
    );

    if (payments.length === 0) {
      throw new AppError("Payment not found", 404);
    }

    const payment = payments[0];

    // 2. Không xử lý payment đã hoàn tất
    if (payment.status === "success" || payment.status === "refunded") {
      throw new AppError("Payment cannot be processed", 400);
    }

    // 3. Thanh toán thất bại
    if (!success) {
      await connection.query(
        `
      UPDATE payments
      SET status = 'failed'
      WHERE id = ?
    `,
        [paymentId],
      );

      await connection.query(
        `
      UPDATE orders
      SET
        payment_status = 'failed',
        status = 'cancelled'
      WHERE id = ?
    `,
        [payment.order_id],
      );

      await restoreOrderStock(
        connection,
        payment.order_id,
        "adjustment",
        "Stock restored because payment failed",
      );

      await connection.commit();

      return {
        id: payment.id,
        orderId: payment.order_id,
        amount: payment.amount,
        status: "failed",
      };
    }

    // 4. Thanh toán thành công
    await connection.query(
      `
        UPDATE payments
        SET
          status = 'success',
          transaction_id = ?,
          paid_at = NOW()
        WHERE id = ?
      `,
      [`MOCK-${payment.id}-${Date.now()}`, paymentId],
    );

    // 5. Cập nhật Order
    await connection.query(
      `
        UPDATE orders
        SET payment_status = 'paid'
        WHERE id = ?
      `,
      [payment.order_id],
    );

    // 6. Xác nhận toàn bộ transaction
    await connection.commit();

    return {
      id: payment.id,
      orderId: payment.order_id,
      amount: payment.amount,
      status: "success",
    };
  } catch (error) {
    // Có lỗi → hủy toàn bộ thay đổi
    await connection.rollback();

    throw error;
  } finally {
    // Trả connection về pool
    connection.release();
  }
};
