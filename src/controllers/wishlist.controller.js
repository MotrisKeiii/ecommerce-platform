import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from "../services/wishlist.service.js";

export const addToWishlistController = async (req, res, next) => {
  try {
    const productId = Number(req.params.productId);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Invalid product ID",
      });
    }

    const item = await addToWishlist(req.user.userId, productId);

    return res.status(201).json({
      success: true,
      data: item,
      message: "Product added to wishlist successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getWishlistController = async (req, res, next) => {
  try {
    const wishlist = await getWishlist(req.user.userId);

    return res.status(200).json({
      success: true,
      data: wishlist,
      message: "Get wishlist successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlistController = async (req, res, next) => {
  try {
    const productId = Number(req.params.productId);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Invalid product ID",
      });
    }

    await removeFromWishlist(req.user.userId, productId);

    return res.status(200).json({
      success: true,
      data: null,
      message: "Product removed from wishlist successfully",
    });
  } catch (error) {
    next(error);
  }
};
