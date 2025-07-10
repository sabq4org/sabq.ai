/**
 * معالج التحقق من صحة البيانات
 * Request Validation Middleware
 * @version 2.1.0
 * @author Sabq AI Team
 */

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ValidationError } from "../utils/errors";

// نوع البيانات المراد التحقق منها
type ValidationTarget = "body" | "query" | "params" | "headers";

// middleware للتحقق من صحة البيانات
export function validateRequest(
  schema: ZodSchema,
  target: ValidationTarget = "body"
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      let dataToValidate: any;

      switch (target) {
        case "body":
          dataToValidate = req.body;
          break;
        case "query":
          dataToValidate = req.query;
          break;
        case "params":
          dataToValidate = req.params;
          break;
        case "headers":
          dataToValidate = req.headers;
          break;
        default:
          dataToValidate = req.body;
      }

      // التحقق من صحة البيانات
      const validatedData = schema.parse(dataToValidate);

      // استبدال البيانات الأصلية بالبيانات المتحقق منها
      switch (target) {
        case "body":
          req.body = validatedData;
          break;
        case "query":
          req.query = validatedData;
          break;
        case "params":
          req.params = validatedData;
          break;
        case "headers":
          req.headers = validatedData;
          break;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = new ValidationError(
          "خطأ في التحقق من صحة البيانات",
          {
            errors: error.errors.map(err => ({
              field: err.path.join("."),
              message: err.message,
              code: err.code,
              received: err.received || undefined,
            })),
            target,
          }
        );
        next(validationError);
      } else {
        next(error);
      }
    }
  };
} 