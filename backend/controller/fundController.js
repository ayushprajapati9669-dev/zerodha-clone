import runTransaction from "../helpers/transactionHelper.js";

import FundTransaction from "../models/FundTransactionModel.js";
import Fund from "../models/FundsModel.js";

import AppError from "../utils/AppError.js";



import { emitNewNotification } from "../utils/notificationSocket.js";

import { createNotificationIfEnabled } from "../helpers/notificationHelper.js";
// ==================================================
// ADD FUNDS
// ==================================================

const addAmount = async (req, res) => {
      const userId = req.user.userId;

      const {
            fundAmount: amountToBeAdded,
      } = req.body;

      const amount = Number(amountToBeAdded);

      try {

            // ==========================================
            // VALIDATION
            // ==========================================

            if (
                  !Number.isFinite(amount) ||
                  amount <= 0
            ) {
                  return res.status(400).json({
                        success: false,
                        message:
                              "amount should be greater than 0",
                  });
            }


            // ==========================================
            // TRANSACTION
            // ==========================================

            const result = await runTransaction(
                  async (session) => {

                        // ==========================================
                        // UPDATE FUND
                        // ==========================================

                        const updatedFund =
                              await Fund.findOneAndUpdate(
                                    { userId },

                                    {
                                          $inc: {
                                                availableBalance:
                                                      amount,
                                          },
                                    },

                                    {
                                          new: true,
                                          session,
                                    },
                              );


                        if (!updatedFund) {
                              throw new AppError(
                                    "Fund not found",
                                    404,
                              );
                        }


                        // ==========================================
                        // FUND TRANSACTION
                        // ==========================================

                        await FundTransaction.insertOne(
                              {
                                    userId,
                                    type: "add",
                                    amount,
                                    status: "completed",
                              },
                              {
                                    session,
                              },
                        );


                        // ==========================================
                        // NOTIFICATION
                        // ==========================================

                        const notification = await createNotificationIfEnabled({
                              userId,
                              eventPreferenceKey: "fundAdded",

                              notificationData: {
                                    type: "fund",
                                    event: "fund_added",
                                    title: "Funds Added",
                                    message: `₹${amount} has been added to your trading account`,
                                    priority: "normal",
                                    isRead: false,
                              },

                              session,
                        });

                        // IMPORTANT:
                        // Do NOT emit here.
                        //
                        // runTransaction will commit first.
                        //
                        return {
                              updatedFund,
                              notification,
                        };
                  },
            );


            // ==========================================
            // SOCKET EMIT
            // ==========================================

            emitNewNotification(
                  result.notification,
            );


            // ==========================================
            // RESPONSE
            // ==========================================

            return res.status(200).json({
                  success: true,

                  message:
                        "fund added successfully",

                  fund:
                        result.updatedFund,
            });

      } catch (err) {

            console.log(err);

            return res.status(
                  err.statusCode || 500,
            ).json({
                  success: false,
                  message: err.message,
            });
      }
};


// ==================================================
// WITHDRAW FUNDS
// ==================================================

const withdrawAmount = async (req, res) => {
      const userId = req.user.userId;

      const {
            withdrawAmount,
      } = req.body;

      const amount =
            Number(withdrawAmount);

      try {

            // ==========================================
            // VALIDATION
            // ==========================================

            if (
                  !Number.isFinite(amount) ||
                  amount <= 0
            ) {
                  return res.status(400).json({
                        success: false,
                        message:
                              "amount should be greater than 0",
                  });
            }


            // ==========================================
            // TRANSACTION
            // ==========================================

            const result = await runTransaction(
                  async (session) => {

                        // ==========================================
                        // UPDATE FUND
                        // ==========================================

                        const updatedFund =
                              await Fund.findOneAndUpdate(
                                    {
                                          userId,

                                          availableBalance:
                                          {
                                                $gte:
                                                      amount,
                                          },
                                    },

                                    {
                                          $inc: {
                                                availableBalance:
                                                      -amount,
                                          },
                                    },

                                    {
                                          new: true,
                                          session,
                                    },
                              );


                        if (!updatedFund) {
                              throw new AppError(
                                    "Insufficient amount",
                                    400,
                              );
                        }


                        // ==========================================
                        // FUND TRANSACTION
                        // ==========================================

                        await FundTransaction.insertOne(
                              {
                                    userId,

                                    type: "withdraw",

                                    amount,

                                    status: "completed",
                              },
                              {
                                    session,
                              },
                        );


                        // ==========================================
                        // NOTIFICATION
                        // ==========================================

                        const notification = await createNotificationIfEnabled({
                              userId,
                              eventPreferenceKey: "fundWithdrawn",

                              notificationData: {
                                    type: "fund",
                                    event: "fund_withdrawn",
                                    title: "Funds Withdrawn",
                                    message: `₹${amount} has been withdrawn from your trading account`,
                                    priority: "normal",
                                    isRead: false,
                              },

                              session,
                        });


                        return {
                              updatedFund,
                              notification,
                        };
                  },
            );


            // ==========================================
            // SOCKET EMIT
            // ==========================================

            emitNewNotification(
                  result.notification,
            );


            // ==========================================
            // RESPONSE
            // ==========================================

            return res.status(200).json({
                  success: true,

                  message:
                        "fund withdrawn successfully",

                  fund:
                        result.updatedFund,
            });

      } catch (err) {

            console.log(err);

            return res.status(
                  err.statusCode || 500,
            ).json({
                  success: false,
                  message: err.message,
            });
      }
};


// ==================================================
// GET USER FUND
// ==================================================

const getUserFund = async (req, res) => {
      const userId = req.user.userId;

      try {

            const fund =
                  await Fund.findOne({
                        userId,
                  });


            if (!fund) {
                  return res.status(404).json({
                        success: false,
                        message:
                              "Fund not found",
                  });
            }


            return res.status(200).json(
                  fund,
            );

      } catch (err) {

            console.log(
                  "error in /api/funds/:id ",
                  err,
            );

            return res.status(500).json({
                  success: false,

                  message:
                        "failed to fetch fund",

                  error:
                        err.message,
            });
      }
};


// ==================================================
// GET FUND TRANSACTIONS
// ==================================================

const getFundTransactions = async (
      req,
      res,
) => {

      const userId =
            req.user.userId;

      try {

            const transactions =
                  await FundTransaction.find({
                        userId,
                  }).sort({
                        createdAt: -1,
                  });


            return res.status(200).json({
                  success: true,
                  transactions,
            });

      } catch (err) {

            console.log(err);

            return res.status(500).json({
                  success: false,

                  message:
                        "failed to fetch fund transactions",

                  error:
                        err.message,
            });
      }
};


export default {
      addAmount,
      withdrawAmount,
      getUserFund,
      getFundTransactions,
};