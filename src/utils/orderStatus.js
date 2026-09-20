export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  SHIPPING: "shipping",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  RETURNED: "returned",
};

export const ORDER_STATUS_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],

  confirmed: ["processing", "cancelled"],

  processing: ["shipping"],

  shipping: ["delivered"],

  delivered: ["returned"],

  cancelled: [],

  returned: [],
};

export const canTransitionOrderStatus = (currentStatus, nextStatus) => {
  return ORDER_STATUS_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false;
};