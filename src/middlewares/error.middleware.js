import { ZodError } from "zod";
import multer from "multer";
import AppError from "../utils/AppError.js";

export const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let statusCode = 500;
  let message = "Internal server error";
  let errors;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = err.issues[0]?.message ?? "Invalid request data";
    errors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  } else if (err instanceof multer.MulterError) {
    statusCode = 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File is too large (max 5MB)"
        : err.message;
  } else if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON body";
  } else if (err.code === "ER_DUP_ENTRY") {
    statusCode = 409;
    message = "Resource already exists";
  }

  if (statusCode >= 500) {
    console.error(err);
    if (process.env.NODE_ENV !== "production") message = err.message || message;
  }

  return res.status(statusCode).json({
    success: false,
    data: null,
    message,
    ...(errors && { errors }),
  });
};
