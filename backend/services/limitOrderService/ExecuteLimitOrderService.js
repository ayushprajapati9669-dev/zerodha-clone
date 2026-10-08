import Order from "../../models/OrdersModel.js";

import AppError from "../../utils/AppError.js";

import {
      getOrderPortfolio,
} from "../../helpers/limitOrderHelper.js";

import data from "../../helpers/portfolioHelper.js";

import {
      getUserFunds,
      saveFunds,
} from "../../helpers/fundHelper.js";

import runTransaction from "../../helpers/transactionHelper.js";


import {
      emitNewNotification,
} from "../../utils/notificationSocket.js";

import { createNotificationIfEnabled } from "../../helpers/notificationHelper.js";
const {
      calculateAveragePrice,
} = data;


// =========================================================
// Execute Limit Order
// =========================================================

export const executeLimitOrder = async (
      orderId,
      currentPrice,
      previousClose,
) => {

      let order;


      try {

            // =====================================================
            // CLAIM ORDER
            // =====================================================

            order =
                  await Order.findOneAndUpdate(
                        {
                              _id: orderId,

                              orderType:
                                    "Limit",

                              status:
                                    "pending",

                              reservationReleased:
                                    false,
                        },

                        {
                              $set: {
                                    status:
                                          "processing",
                              },
                        },

                        {
                              new: true,
                        },
                  );


            // =====================================================
            // ORDER ALREADY PROCESSED
            // =====================================================

            if (!order) {

                  return {
                        executed: false,

                        message:
                              "Order is already processed",
                  };
            }


            // =====================================================
            // VALIDATE CURRENT PRICE
            // =====================================================

            if (
                  typeof currentPrice !==
                  "number" ||
                  !Number.isFinite(
                        currentPrice,
                  ) ||
                  currentPrice <= 0
            ) {

                  throw new AppError(
                        "Current market price must be greater than 0",
                        400,
                  );
            }


            // =====================================================
            // VALIDATE PREVIOUS CLOSE
            // =====================================================

            if (
                  typeof previousClose !==
                  "number" ||
                  !Number.isFinite(
                        previousClose,
                  ) ||
                  previousClose <= 0
            ) {

                  throw new AppError(
                        "Previous close must be greater than 0",
                        400,
                  );
            }


            // =====================================================
            // CHECK LIMIT CONDITION
            // =====================================================

            const canExecute =
                  order.type === "buy"
                        ? currentPrice <=
                        order.price
                        : currentPrice >=
                        order.price;


            if (!canExecute) {

                  await Order.updateOne(
                        {
                              _id:
                                    order._id,

                              status:
                                    "processing",
                        },

                        {
                              $set: {
                                    status:
                                          "pending",
                              },
                        },
                  );


                  return {
                        executed: false,

                        message:
                              "Limit price condition not satisfied",
                  };
            }


            // =====================================================
            // DATABASE TRANSACTION
            // =====================================================

            const result =
                  await runTransaction(
                        async (session) => {

                              // ==========================================
                              // GET ORDER INSIDE TRANSACTION
                              // ==========================================

                              const transactionOrder =
                                    await Order.findOne(
                                          {
                                                _id:
                                                      order._id,

                                                status:
                                                      "processing",

                                                reservationReleased:
                                                      false,
                                          },
                                    ).session(
                                          session,
                                    );


                              if (
                                    !transactionOrder
                              ) {

                                    throw new AppError(
                                          "Order is no longer available for execution",
                                          409,
                                    );
                              }


                              // ==========================================
                              // USER ID
                              // ==========================================

                              const userId =
                                    transactionOrder.userId;


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
                              // TRADE AMOUNT
                              // ==========================================

                              const tradeAmount =
                                    currentPrice *
                                    transactionOrder.quantity;


                              // ==========================================
                              // PORTFOLIO
                              // ==========================================

                              const {
                                    portfolio,
                                    PortfolioModel,
                              } =
                                    await getOrderPortfolio(
                                          transactionOrder,
                                          session,
                                    );


                              // ==========================================
                              // BUY LIMIT ORDER
                              // ==========================================

                              if (
                                    transactionOrder.type ===
                                    "buy"
                              ) {

                                    const reservedAmount =
                                          transactionOrder.reservedAmount ||
                                          0;


                                    if (
                                          reservedAmount <=
                                          0
                                    ) {

                                          throw new AppError(
                                                "Reserved amount is invalid",
                                                400,
                                          );
                                    }


                                    if (
                                          tradeAmount >
                                          reservedAmount
                                    ) {

                                          throw new AppError(
                                                "Reserved amount is insufficient",
                                                400,
                                          );
                                    }


                                    if (
                                          reservedAmount >
                                          userFund.reservedBalance
                                    ) {

                                          throw new AppError(
                                                "Reserved balance is inconsistent",
                                                400,
                                          );
                                    }


                                    // Release reservation

                                    userFund.reservedBalance -=
                                          reservedAmount;


                                    // Actual amount used

                                    userFund.usedBalance +=
                                          tradeAmount;


                                    // Unused amount

                                    const remainingAmount =
                                          reservedAmount -
                                          tradeAmount;


                                    userFund.availableBalance +=
                                          remainingAmount;


                                    await saveFunds(
                                          userFund,
                                          session,
                                    );


                                    // ==========================================
                                    // CREATE PORTFOLIO
                                    // ==========================================

                                    if (!portfolio) {

                                          const portfolioData =
                                          {
                                                userId,

                                                symbol:
                                                      transactionOrder.symbol,

                                                companyName:
                                                      transactionOrder.companyName,

                                                quantity:
                                                      transactionOrder.quantity,

                                                reservedQuantity:
                                                      0,

                                                averagePrice:
                                                      currentPrice,

                                                currentPrice:
                                                      currentPrice,

                                                previousClose:
                                                      previousClose,

                                                product:
                                                      transactionOrder.product,
                                          };


                                          await PortfolioModel.create(
                                                [
                                                      portfolioData,
                                                ],
                                                {
                                                      session,
                                                },
                                          );

                                    } else {

                                          const {
                                                quantity,
                                                averagePrice,
                                          } =
                                                calculateAveragePrice(
                                                      portfolio.quantity,

                                                      portfolio.averagePrice,

                                                      transactionOrder.quantity,

                                                      currentPrice,
                                                );


                                          portfolio.quantity =
                                                quantity;

                                          portfolio.averagePrice =
                                                averagePrice;

                                          portfolio.currentPrice =
                                                currentPrice;

                                          portfolio.previousClose =
                                                previousClose;


                                          await portfolio.save(
                                                {
                                                      session,
                                                },
                                          );
                                    }
                              }


                              // ==========================================
                              // SELL LIMIT ORDER
                              // ==========================================

                              else {

                                    if (!portfolio) {

                                          throw new AppError(
                                                transactionOrder.product ===
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
                                          transactionOrder.quantity >
                                          reservedQuantity
                                    ) {

                                          throw new AppError(
                                                "Insufficient reserved quantity",
                                                400,
                                          );
                                    }


                                    const soldInvestment =
                                          transactionOrder.quantity *
                                          portfolio.averagePrice;


                                    portfolio.quantity -=
                                          transactionOrder.quantity;


                                    portfolio.reservedQuantity =
                                          reservedQuantity -
                                          transactionOrder.quantity;


                                    if (
                                          portfolio.quantity ===
                                          0
                                    ) {

                                          await portfolio.deleteOne(
                                                {
                                                      session,
                                                },
                                          );

                                    } else {

                                          portfolio.currentPrice =
                                                currentPrice;

                                          portfolio.previousClose =
                                                previousClose;


                                          await portfolio.save(
                                                {
                                                      session,
                                                },
                                          );
                                    }


                                    // Sale money

                                    userFund.availableBalance +=
                                          tradeAmount;


                                    // Remove invested amount

                                    userFund.usedBalance -=
                                          soldInvestment;


                                    if (
                                          userFund.usedBalance <
                                          0
                                    ) {

                                          userFund.usedBalance =
                                                0;
                                    }


                                    await saveFunds(
                                          userFund,
                                          session,
                                    );
                              }


                              // ==========================================
                              // COMPLETE ORDER
                              // ==========================================

                              transactionOrder.executionPrice =
                                    currentPrice;

                              transactionOrder.status =
                                    "completed";

                              transactionOrder.reservationReleased =
                                    true;

                              transactionOrder.reservedAmount =
                                    0;

                              transactionOrder.executedAt =
                                    new Date();


                              await transactionOrder.save(
                                    {
                                          session,
                                    },
                              );


                              // ==========================================
                              // NOTIFICATION
                              // ==========================================

                              const notificationMessage =
                                    transactionOrder.type ===
                                          "buy"
                                          ? `Bought ${transactionOrder.quantity} ${transactionOrder.symbol} at ₹${currentPrice}`
                                          : `Sold ${transactionOrder.quantity} ${transactionOrder.symbol} at ₹${currentPrice}`;


                              const notification = await createNotificationIfEnabled({
                                    userId: transactionOrder.userId,
                                    eventPreferenceKey: "orderExecuted",

                                    notificationData: {
                                          type: "order",
                                          event: "order_executed",
                                          title: "Limit Order Executed",
                                          message: notificationMessage,
                                          priority: "high",
                                          isRead: false,
                                    },

                                    session,
                              });
                              // No emit here.


                              return {

                                    message:
                                          "Limit order executed successfully",

                                    order:
                                          transactionOrder,

                                    notification,
                              };
                        },
                  );


            // =====================================================
            // SOCKET AFTER TRANSACTION COMMIT
            // =====================================================

            emitNewNotification(
                  result.notification,
            );


            return {

                  executed:
                        true,

                  message:
                        result.message,

                  order:
                        result.order,
            };

      } catch (error) {

            // =====================================================
            // RESET PROCESSING -> PENDING
            // =====================================================

            if (order?._id) {

                  try {

                        await Order.updateOne(
                              {
                                    _id:
                                          order._id,

                                    status:
                                          "processing",
                              },

                              {
                                    $set: {
                                          status:
                                                "pending",
                                    },
                              },
                        );

                  } catch (
                  resetError
                  ) {

                        console.error(
                              "Unable to reset processing order:",
                              resetError.message,
                        );
                  }
            }


            console.error(
                  `Limit order execution failed ` +
                  `(${order?.symbol || orderId}):`,
                  error.message,
            );


            throw error;
      }
};


export default executeLimitOrder;