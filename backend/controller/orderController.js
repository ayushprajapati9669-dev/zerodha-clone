import Order from "../models/OrdersModel.js";


import cancelLimitOrder from "../services/limitOrderService/cancelLimitOrderService.js";

import createOrder from "../services/createOrderServices.js";


// =====================================================
// GET ALL ORDERS
// =====================================================

const getAllOrders = async (req, res) => {
      try {

            const userId = req.user.userId;

            const orders = await Order.find({
                  userId,
            }).sort({
                  createdAt: -1,
            });

            return res.status(200).json(orders);

      } catch (err) {

            console.log(
                  "Orders data not fetched:",
                  err.message
            );

            return res.status(500).json({
                  success: false,
                  message: "Failed to fetch orders",
            });
      }
};


// =====================================================
// CREATE ORDER
// =====================================================

const createOrderController = async (req, res) => {
      try {

            // IMPORTANT:
            // Never trust userId coming from frontend.
            // Always use authenticated user's ID.

            const result = await createOrder({
                  ...req.body,
                  userId: req.user.userId,
            });

            return res.status(201).json({
                  success: true,
                  order: result,
            });

      } catch (err) {

            console.log(
                  "inside createOrderController="
            );

            console.log(err.message);

            return res.status(
                  err.statusCode || 500
            ).json({
                  success: false,
                  message: err.message,
            });
      }
};


// =====================================================
// CANCEL LIMIT ORDER
// =====================================================

const cancelLimitOrderController = async (
      req,
      res
) => {

      try {

            const {
                  orderId,
            } = req.body;

            const result = await cancelLimitOrder(
                  orderId,
                  req
            );

            return res.status(200).json({
                  success: true,
                  ...result,
            });

      } catch (err) {

            console.log(
                  "Limit order cancellation error:",
                  err.message
            );

            return res.status(
                  err.statusCode || 500
            ).json({
                  success: false,
                  message: err.message,
            });
      }
};


// =====================================================
// EXPORT CONTROLLERS
// =====================================================

export default {
      getAllOrders,
      createOrderController,
      cancelLimitOrderController,
};