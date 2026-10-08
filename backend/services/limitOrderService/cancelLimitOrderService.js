import Order from "../../models/OrdersModel.js";

import AppError from "../../utils/AppError.js";

import {
      getOrderPortfolio,
} from "../../helpers/limitOrderHelper.js";



import {
      getUserFunds,
      saveFunds,
} from "../../helpers/fundHelper.js";

import runTransaction from "../../helpers/transactionHelper.js";

import {
      emitNewNotification,
} from "../../utils/notificationSocket.js";

import { createNotificationIfEnabled } from "../../helpers/notificationHelper.js";
export const cancelLimitOrder = async (
      orderId,
      req,
) => {

      const result =
            await runTransaction(
                  async (session) => {

                        // ==========================================
                        // USER ID
                        // ==========================================

                        const userId =
                              req.user.userId;


                        // ==========================================
                        // FIND ORDER
                        // ==========================================

                        const order =
                              await Order.findOne({
                                    _id: orderId,
                                    userId,
                              }).session(session);


                        if (!order) {
                              throw new AppError(
                                    "Order not found",
                                    404,
                              );
                        }


                        // ==========================================
                        // VALIDATE LIMIT ORDER
                        // ==========================================

                        if (
                              order.orderType !==
                              "Limit" ||
                              order.status !==
                              "pending"
                        ) {

                              throw new AppError(
                                    "Order is not a pending limit order",
                                    400,
                              );
                        }


                        // ==========================================
                        // RESERVATION VALIDATION
                        // ==========================================

                        if (
                              order.reservationReleased ===
                              true
                        ) {

                              throw new AppError(
                                    "Order reservation is already released",
                                    400,
                              );
                        }


                        // ==========================================
                        // USER FUNDS
                        // ==========================================

                        const userFund =
                              await getUserFunds(
                                    userId,
                                    session,
                              );


                        if (!userFund) {
                              throw new AppError(
                                    "Funds not found",
                                    404,
                              );
                        }


                        // ==========================================
                        // RESERVED AMOUNT
                        // ==========================================

                        const reservedAmount =
                              order.reservedAmount ||
                              0;


                        // ==========================================
                        // PORTFOLIO
                        // ==========================================

                        let portfolio = null;


                        if (
                              order.type ===
                              "sell"
                        ) {

                              const portfolioData =
                                    await getOrderPortfolio(
                                          order,
                                          session,
                                    );

                              portfolio =
                                    portfolioData.portfolio;
                        }


                        // ==========================================
                        // BUY LIMIT ORDER
                        // ==========================================

                        if (
                              order.type ===
                              "buy"
                        ) {

                              if (
                                    reservedAmount >
                                    userFund.reservedBalance
                              ) {

                                    throw new AppError(
                                          "Reserved balance is inconsistent",
                                          400,
                                    );
                              }


                              // Return reserved money

                              userFund.availableBalance +=
                                    reservedAmount;


                              userFund.reservedBalance -=
                                    reservedAmount;


                              await saveFunds(
                                    userFund,
                                    session,
                              );
                        }


                        // ==========================================
                        // SELL LIMIT ORDER
                        // ==========================================

                        else {

                              if (!portfolio) {

                                    throw new AppError(
                                          order.product ===
                                                "CNC"
                                                ? "You do not own this stock"
                                                : "You do not own this position",
                                          400,
                                    );
                              }


                              const reservedQuantity =
                                    portfolio.reservedQuantity ||
                                    0;


                              if (
                                    order.quantity >
                                    reservedQuantity
                              ) {

                                    throw new AppError(
                                          "Reserved quantity is inconsistent",
                                          400,
                                    );
                              }


                              portfolio.reservedQuantity =
                                    reservedQuantity -
                                    order.quantity;


                              await portfolio.save({
                                    session,
                              });
                        }


                        // ==========================================
                        // MARK ORDER CANCELLED
                        // ==========================================

                        order.status =
                              "cancelled";

                        order.reservationReleased =
                              true;

                        order.reservedAmount =
                              0;


                        await order.save({
                              session,
                        });


                        // ==========================================
                        // NOTIFICATION
                        // ==========================================

                        const notificationMessage =
                              `${order.type.toUpperCase()} limit order for ` +
                              `${order.quantity} ${order.symbol} has been cancelled.`;

                        const notification = await createNotificationIfEnabled({
                              userId,
                              eventPreferenceKey: "orderCancelled",

                              notificationData: {
                                    type: "order",
                                    event: "order_cancelled",
                                    title: "Limit Order Cancelled",
                                    message: notificationMessage,
                                    priority: "normal",
                                    isRead: false,
                              },

                              session,
                        });

                        // DO NOT SOCKET EMIT HERE.


                        return {
                              message:
                                    "Limit order cancelled successfully",

                              order,

                              notification,
                        };
                  },
            );


      // ==========================================
      // SOCKET AFTER COMMIT
      // ==========================================

      emitNewNotification(
            result.notification,
      );


      return {
            message:
                  result.message,

            order:
                  result.order,
      };
};


export default cancelLimitOrder;