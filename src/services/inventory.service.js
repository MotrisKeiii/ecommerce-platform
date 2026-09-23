export const restoreOrderStock = async (
  connection,
  orderId,
  inventoryType = "adjustment",
  inventoryNote = "Stock restored because order was cancelled",
) => {
  const [items] = await connection.query(
    `
      SELECT
        product_variant_id,
        quantity
      FROM order_items
      WHERE order_id = ?
    `,
    [orderId],
  );

  for (const item of items) {
    await connection.query(
      `
        UPDATE product_variants
        SET stock = stock + ?
        WHERE id = ?
      `,
      [item.quantity, item.product_variant_id],
    );

    await connection.query(
      `
        INSERT INTO inventory_transactions (
          product_variant_id,
          type,
          quantity,
          reference_type,
          reference_id,
          note
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        item.product_variant_id,
        inventoryType,
        item.quantity,
        "order",
        orderId,
        inventoryNote,
      ],
    );
  }
};
