import Joi from "joi";

const orderValidationSchema = Joi.object({

      symbol: Joi.string()
            .trim()
            .required(),

      companyName: Joi.string()
            .trim()
            .required(),

      type: Joi.string()
            .valid("buy", "sell")
            .required(),

      quantity: Joi.number()
            .integer()
            .min(1)
            .required(),

      orderType: Joi.string()
            .valid("Market", "Limit")
            .required(),

      // Market:
      // price optional
      //
      // Limit:
      // price required and > 0

      price: Joi.when("orderType", {

            is: "Limit",

            then: Joi.number()
                  .positive()
                  .required(),

            otherwise: Joi.number()
                  .min(0)
                  .optional()
                  .default(0),

      }),

      product: Joi.string()
            .valid("CNC", "MIS")
            .required(),

}).options({

      abortEarly: false,

});

export default orderValidationSchema;