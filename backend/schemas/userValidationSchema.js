import Joi from "joi";

const userValidationSchema = Joi.object({
      name: Joi.string()
            .trim()
            .min(2)
            .max(50)
            .required()
            .messages({
                  "string.empty": "Name is required",
                  "string.min": "Name must be at least 2 characters",
                  "string.max": "Name cannot exceed 50 characters",
                  "any.required": "Name is required",
            }),

      email: Joi.string()
            .trim()
            .lowercase()
            .email()
            .required()
            .messages({
                  "string.empty": "Email is required",
                  "string.email": "Please enter a valid email",
                  "any.required": "Email is required",
            }),

      mobile: Joi.string()
            .trim()
            .pattern(/^[6-9]\d{9}$/)
            .required()
            .messages({
                  "string.empty": "Mobile number is required",
                  "string.pattern.base":
                        "Mobile number must be a valid 10-digit Indian mobile number",
                  "any.required": "Mobile number is required",
            }),

      password: Joi.string()
            .min(8)
            .max(30)
            .required()
            .messages({
                  "string.empty": "Password is required",
                  "string.min": "Password must be at least 8 characters",
                  "string.max": "Password cannot exceed 30 characters",
                  "any.required": "Password is required",
            }),
});

export default userValidationSchema;