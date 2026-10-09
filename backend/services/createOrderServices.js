import Order from "../models/OrdersModel.js";

import Holding from "../models/HoldingsModel.js";

import Position from "../models/PositionsModel.js";

import Notification from "../models/NotificationModel.js";

import AppError from "../utils/AppError.js";

import runTransaction from "../helpers/transactionHelper.js";

import {
      reducePortfolioQuantity,
      createOrUpdatePortfolio,
} from "../helpers/portfolioHelper.js";

import {
      getUserFunds,
      checkAvailableBalance,
      saveFunds,
} from "../helpers/fundHelper.js";

import {
      getTrueDataPrice,
} from "./trueDataService.js";

import {
      emitNewNotification,
} from "../utils/notificationSocket.js";
import { createNotificationIfEnabled } from "../helpers/notificationHelper.js";
import { evaluateOrderRiskService } from "./riskService.js";

// ==================================================
// CREATE ORDER
// ==================================================

const createOrder = async (
      orderData,
) => {

      const {
            userId,
            symbol,
            companyName,
            type,
            quantity,
            orderType,
            price,
            product,
      } = orderData;


      const result =
            await runTransaction(
                  async (session) => {

                        // ==========================================
                        // NORMALIZE
                        // ==========================================

                        const normalizedQuantity =
                              Number(quantity);

                        const normalizedPrice =
                              Number(price);


                        // ==========================================
                        // VALIDATION
                        // ==========================================

                        if (!userId) {
                              throw new AppError(
                                    "User authentication required",
                                    401,
                              );
                        }


                        const normalizedSymbol =
                              symbol
                                    .trim()
                                    .toUpperCase();


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
                                    "Fund not found",
                                    404,
                              );
                        }


                        // ==========================================
                        // PRICE
                        // ==========================================

                        let marketData =
                              null;

                        let executionPrice =
                              null;


                        // ==========================================
                        // MARKET ORDER
                        // ==========================================

                        if (
                              orderType ===
                              "Market"
                        ) {

                              try {

                                    marketData =
                                          getTrueDataPrice(
                                                normalizedSymbol,
                                          );

                              } catch (
                              error
                              ) {

                                    console.error(
                                          `TrueData price error for ${normalizedSymbol}:`,
                                          error.message,
                                    );

                                    throw new AppError(
                                          `Live market price not available for ${normalizedSymbol}. Please wait for TrueData live data.`,
                                          503,
                                    );
                              }


                              executionPrice =
                                    Number(
                                          marketData.currentPrice,
                                    );


                              if (
                                    !Number.isFinite(
                                          executionPrice,
                                    ) ||
                                    executionPrice <=
                                    0
                              ) {

                                    throw new AppError(
                                          `Invalid live market price for ${normalizedSymbol}`,
                                          503,
                                    );
                              }

                        }

                        // ==========================================
                        // LIMIT ORDER
                        // ==========================================

                        else {

                              executionPrice =
                                    normalizedPrice;
                        }


                        // ==========================================
                        // TRADE AMOUNT
                        // ==========================================

                        const tradeAmount =
                              normalizedQuantity *
                              executionPrice;


                        if (
                              !Number.isFinite(
                                    tradeAmount,
                              ) ||
                              tradeAmount <= 0
                        ) {

                              throw new AppError(
                                    "Invalid trade amount",
                                    400,
                              );
                        }


                        // ==========================================
                        // PRE-TRADE RISK CHECK
                        // ==========================================

                        const riskCheckResult = await evaluateOrderRiskService(
                              userId,
                              {
                                    symbol: normalizedSymbol,
                                    type,
                                    quantity: normalizedQuantity,
                                    orderType,
                                    price: executionPrice,
                                    product: product || "CNC",
                                    stopLossPrice: orderData.stopLossPrice,
                                    targetPrice: orderData.targetPrice,
                              }
                        );

                        if (riskCheckResult.allowed === false) {
                              const violationMsg = riskCheckResult.violations.length > 0 
                                    ? riskCheckResult.violations.join(" ") 
                                    : "Order rejected by Smart Risk Guard rules in strict mode.";
                              throw new AppError(
                                    `Risk Guard Rejection: ${violationMsg}`,
                                    400
                              );
                        }


                        // ==========================================
                        // CNC
                        // ==========================================

                        if (
                              product ===
                              "CNC"
                        ) {

                              const holding =
                                    await Holding.findOne(
                                          {
                                                userId,

                                                symbol:
                                                      normalizedSymbol,
                                          },
                                          null,
                                          {
                                                session,
                                          },
                                    );


                              // ==========================================
                              // CNC SELL
                              // ==========================================

                              if (
                                    type ===
                                    "sell"
                              ) {

                                    if (!holding) {

                                          throw new AppError(
                                                "You do not own this stock",
                                                400,
                                          );
                                    }


                                    const reservedQuantity =
                                          holding.reservedQuantity ||
                                          0;


                                    const availableQuantity =
                                          holding.quantity -
                                          reservedQuantity;


                                    if (
                                          normalizedQuantity >
                                          availableQuantity
                                    ) {

                                          throw new AppError(
                                                "Insufficient available holdings",
                                                400,
                                          );
                                    }


                                    // ==========================================
                                    // MARKET SELL
                                    // ==========================================

                                    if (
                                          orderType ===
                                          "Market"
                                    ) {

                                          const soldInvestment =
                                                normalizedQuantity *
                                                holding.averagePrice;


                                          await reducePortfolioQuantity(
                                                holding,

                                                normalizedQuantity,

                                                session,
                                          );


                                          userFund.availableBalance +=
                                                tradeAmount;


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
                                    // LIMIT SELL
                                    // ==========================================

                                    else {

                                          holding.reservedQuantity =
                                                reservedQuantity +
                                                normalizedQuantity;


                                          await holding.save(
                                                {
                                                      session,
                                                },
                                          );
                                    }

                              }

                              // ==========================================
                              // CNC BUY
                              // ==========================================

                              else {

                                    checkAvailableBalance(
                                          userFund,
                                          tradeAmount,
                                    );


                                    // ==========================================
                                    // MARKET BUY
                                    // ==========================================

                                    if (
                                          orderType ===
                                          "Market"
                                    ) {

                                          userFund.availableBalance -=
                                                tradeAmount;

                                          userFund.usedBalance +=
                                                tradeAmount;


                                          await saveFunds(
                                                userFund,
                                                session,
                                          );


                                          await createOrUpdatePortfolio(
                                                {
                                                      Model:
                                                            Holding,

                                                      existingPortfolio:
                                                            holding,

                                                      userId,

                                                      symbol:
                                                            normalizedSymbol,

                                                      companyName,

                                                      quantity:
                                                            normalizedQuantity,

                                                      price:
                                                            executionPrice,

                                                      previousClose:
                                                            marketData.previousClose,

                                                      product:
                                                            "CNC",

                                                      type,

                                                      session,
                                                },
                                          );

                                    }

                                    // ==========================================
                                    // LIMIT BUY
                                    // ==========================================

                                    else {

                                          userFund.availableBalance -=
                                                tradeAmount;

                                          userFund.reservedBalance +=
                                                tradeAmount;


                                          await saveFunds(
                                                userFund,
                                                session,
                                          );
                                    }
                              }

                        }

                        // ==========================================
                        // MIS
                        // ==========================================

                        else {

                              const position =
                                    await Position.findOne(
                                          {
                                                userId,

                                                symbol:
                                                      normalizedSymbol,

                                                product:
                                                      "MIS",
                                          },
                                          null,
                                          {
                                                session,
                                          },
                                    );


                              // ==========================================
                              // MIS SELL
                              // ==========================================

                              if (
                                    type ===
                                    "sell"
                              ) {

                                    if (!position) {

                                          throw new AppError(
                                                "You do not own this position",
                                                400,
                                          );
                                    }


                                    const reservedQuantity =
                                          position.reservedQuantity ||
                                          0;


                                    const availableQuantity =
                                          position.quantity -
                                          reservedQuantity;


                                    if (
                                          normalizedQuantity >
                                          availableQuantity
                                    ) {

                                          throw new AppError(
                                                "Insufficient available positions",
                                                400,
                                          );
                                    }


                                    // ==========================================
                                    // MARKET SELL
                                    // ==========================================

                                    if (
                                          orderType ===
                                          "Market"
                                    ) {

                                          const soldInvestment =
                                                normalizedQuantity *
                                                position.averagePrice;


                                          await reducePortfolioQuantity(
                                                position,

                                                normalizedQuantity,

                                                session,
                                          );


                                          userFund.availableBalance +=
                                                tradeAmount;


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
                                    // LIMIT SELL
                                    // ==========================================

                                    else {

                                          position.reservedQuantity =
                                                reservedQuantity +
                                                normalizedQuantity;


                                          await position.save(
                                                {
                                                      session,
                                                },
                                          );
                                    }

                              }

                              // ==========================================
                              // MIS BUY
                              // ==========================================

                              else {

                                    checkAvailableBalance(
                                          userFund,
                                          tradeAmount,
                                    );


                                    // ==========================================
                                    // MARKET BUY
                                    // ==========================================

                                    if (
                                          orderType ===
                                          "Market"
                                    ) {

                                          userFund.availableBalance -=
                                                tradeAmount;

                                          userFund.usedBalance +=
                                                tradeAmount;


                                          await saveFunds(
                                                userFund,
                                                session,
                                          );


                                          await createOrUpdatePortfolio(
                                                {
                                                      Model:
                                                            Position,

                                                      existingPortfolio:
                                                            position,

                                                      userId,

                                                      symbol:
                                                            normalizedSymbol,

                                                      companyName,

                                                      quantity:
                                                            normalizedQuantity,

                                                      price:
                                                            executionPrice,

                                                      previousClose:
                                                            marketData.previousClose,

                                                      product:
                                                            "MIS",

                                                      type,

                                                      session,
                                                },
                                          );

                                    }

                                    // ==========================================
                                    // LIMIT BUY
                                    // ==========================================

                                    else {

                                          userFund.availableBalance -=
                                                tradeAmount;

                                          userFund.reservedBalance +=
                                                tradeAmount;


                                          await saveFunds(
                                                userFund,
                                                session,
                                          );
                                    }
                              }
                        }


                        // ==========================================
                        // ORDER DOCUMENT
                        // ==========================================

                        const orderDataToSave =
                        {

                              userId,

                              symbol:
                                    normalizedSymbol,

                              companyName,

                              type,

                              quantity:
                                    normalizedQuantity,

                              orderType,

                              // Limit:
                              // original limit price

                              // Market:
                              // actual execution price

                              price:
                                    executionPrice,

                              executionPrice:
                                    orderType ===
                                          "Market"
                                          ? executionPrice
                                          : null,

                              product,

                              status:
                                    orderType ===
                                          "Market"
                                          ? "completed"
                                          : "pending",

                              reservedAmount:
                                    orderType ===
                                          "Limit" &&
                                          type ===
                                          "buy"
                                          ? tradeAmount
                                          : 0,

                              reservationReleased:
                                    orderType ===
                                    "Market",

                              executedAt:
                                    orderType ===
                                          "Market"
                                          ? new Date()
                                          : null,
                        };


                        // ==========================================
                        // SAVE ORDER
                        // ==========================================

                        const [
                              newOrder,
                        ] = await Order.create(
                              [
                                    orderDataToSave,
                              ],
                              {
                                    session,
                              },
                        );


                        // ==========================================
                        // NOTIFICATION
                        // ==========================================

                        const isMarketOrder =
                              orderType ===
                              "Market";


                        const notificationTitle =
                              isMarketOrder
                                    ? "Order Executed"
                                    : "Limit Order Placed";


                        const notificationEvent =
                              isMarketOrder
                                    ? "order_executed"
                                    : "order_placed";

                        const eventPreferenceKey =
                              isMarketOrder
                                    ? "orderExecuted"
                                    : "orderPlaced";
                        const notificationMessage =
                              isMarketOrder

                                    ? `${type ===
                                          "buy"
                                          ? "Bought"
                                          : "Sold"
                                    } ${normalizedQuantity} ${normalizedSymbol} at ₹${executionPrice}`

                                    : `${type ===
                                          "buy"
                                          ? "Buy"
                                          : "Sell"
                                    } limit order placed for ${normalizedQuantity} ${normalizedSymbol} at ₹${executionPrice}`;


                        const notificationPriority =
                              isMarketOrder
                                    ? "high"
                                    : "normal";


                        const notification = await createNotificationIfEnabled({
                              userId,
                              eventPreferenceKey,

                              notificationData: {
                                    type: "order",
                                    event: notificationEvent,
                                    title: notificationTitle,
                                    message: notificationMessage,
                                    priority: isMarketOrder ? "high" : "normal",
                                    isRead: false,
                              },

                              session,
                        });
                        // ==========================================
                        // IMPORTANT
                        // ==========================================
                        //
                        // DO NOT call:
                        //
                        // session.commitTransaction()
                        //
                        // runTransaction() handles it.
                        //
                        // DO NOT emit socket here.
                        //
                        // ==========================================


                        return {

                              message:
                                    isMarketOrder
                                          ? "Order created successfully"
                                          : "Limit order placed successfully",

                              order:
                                    newOrder,

                              notification,
                        };
                  },
            );


      // ==========================================
      // SOCKET AFTER SUCCESSFUL COMMIT
      // ==========================================

      emitNewNotification(
            result.notification,
      );


      // ==========================================
      // RESPONSE
      // ==========================================

      return {

            message:
                  result.message,

            order:
                  result.order,
      };
};


export default createOrder;