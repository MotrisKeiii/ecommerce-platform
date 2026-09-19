import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../services/cart.service.js";

import {
  addToCartSchema,
  updateCartItemSchema,
} from "../validators/cart.validator.js";

export const addToCartController = async (req, res, next) => {
  try {
    const validatedData = addToCartSchema.parse(req.body);

    const cartItem = await addToCart(req.user.userId, validatedData);

    return res.status(201).json({
      success: true,
      data: cartItem,
      message: "Product added to cart successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getCartController = async (req, res, next) => {
  try {
    const cart = await getCart(req.user.userId);

    return res.status(200).json({
      success: true,
      data: cart,
      message: "Get cart successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItemController = async (req, res, next) => {
  try {
    const validatedData = updateCartItemSchema.parse(req.body);

    const cartItem = await updateCartItem(
      req.user.userId,
      Number(req.params.id),
      validatedData,
    );

    return res.status(200).json({
      success: true,
      data: cartItem,
      message: "Cart item updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const removeCartItemController = async (req, res, next) => {
  try {
    await removeCartItem(req.user.userId, Number(req.params.id));

    return res.status(200).json({
      success: true,
      data: null,
      message: "Cart item removed successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const clearCartController = async (req, res, next) => {
  try {
    await clearCart(req.user.userId);

    return res.status(200).json({
      success: true,
      data: null,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    next(error);
  }
};
