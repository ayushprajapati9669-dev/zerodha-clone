import orderValidationSchema from "../schemas/orderValidationSchema.js";
const validateOrder = (req, res, next) => {
      const { error } = orderValidationSchema.validate(req.body);
      if (error) {
            return res.status(400).json({
                  success: false,
                  message: error.details[0].message
            });

      }
      next();
}
export default validateOrder;