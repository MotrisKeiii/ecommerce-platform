import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import brandRoutes from "./routes/brand.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import productRoutes from "./routes/product.routes.js";
import productVariantRoutes from "./routes/product-variant.routes.js";
import productImageRoutes from "./routes/product-image.routes.js";
import productImageItemRoutes from "./routes/product-image-item.routes.js";
import addressRoutes from "./routes/address.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import adminReviewRoutes from "./routes/admin-review.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import checkoutRoutes from "./routes/checkout.routes.js";
import orderRoutes from "./routes/order.routes.js";
import adminOrderRoutes from "./routes/admin-order.routes.js";
import adminInventoryRoutes from "./routes/admin-inventory.routes.js";

import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use("/api/brands", brandRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/product-variants", productVariantRoutes);
app.use("/api/products", productImageRoutes);
app.use("/api/product-images", productImageItemRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin/reviews", adminReviewRoutes);

app.use("/api/payments", paymentRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", orderRoutes);

app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/inventory", adminInventoryRoutes);


app.use(errorMiddleware);

export default app;


