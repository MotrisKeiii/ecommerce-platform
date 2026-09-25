import pool from "../config/database.js";
import AppError from "../utils/AppError.js";
import { changeOrderStatusInTransaction } from "./order.service.js";

export const processMockPayment = async (userId, paymentId, success) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Tìm payment (khóa payment + order để tránh xử lý song song)
    const [payments] = await connection.query(
      `
        SELECT
          p.id,
          p.order_id,
          p.amount,
          p.status,
          p.provider,
          o.user_id,
          o.status AS order_status
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

    // 2. Chỉ cho xử lý khi payment còn 'pending' (failed/success/refunded đều bị chặn)
    if (payment.status !== "pending") {
      throw new AppError("Payment cannot be processed", 400);
    }

    // 3. Chỉ payment mock mới đi qua endpoint này (không cho "trả" đơn COD/momo bằng mock)
    if (payment.provider !== "mock") {
      throw new AppError("This payment is not a mock payment", 400);
    }

    // 4. Đơn phải còn 'pending' (đơn đã hủy/đã xử lý thì không được thanh toán)
    if (payment.order_status !== "pending") {
      throw new AppError("Order is not awaiting payment", 400);
    }

    // 5. Thanh toán thất bại -> hủy đơn bằng hàm dùng chung (hoàn kho + trả coupon 1 lần)
    if (!success) {
      await connection.query(
        `UPDATE payments SET status = 'failed' WHERE id = ?`,
        [paymentId],
      );

      await connection.query(
        `UPDATE orders SET payment_status = 'failed' WHERE id = ?`,
        [payment.order_id],
      );

      await changeOrderStatusInTransaction(
        connection,
        payment.order_id,
        "cancelled",
        { note: "Stock restored because payment failed" },
      );

      await connection.commit();

      return {
        id: payment.id,
        orderId: payment.order_id,
        amount: payment.amount,
        status: "failed",
      };
    }

    // 6. Thanh toán thành công
    await connection.query(
      `
        UPDATE payments
        SET status = 'success', transaction_id = ?, paid_at = NOW()
        WHERE id = ?
      `,
      [`MOCK-${payment.id}-${Date.now()}`, paymentId],
    );

    await connection.query(
      `UPDATE orders SET payment_status = 'paid' WHERE id = ?`,
      [payment.order_id],
    );

    await connection.commit();

    return {
      id: payment.id,
      orderId: payment.order_id,
      amount: payment.amount,
      status: "success",
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
