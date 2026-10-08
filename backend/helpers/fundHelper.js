import Fund from "../models/FundsModel.js";
import AppError from "../utils/AppError.js";
// User ke funds fetch karne ke liye
export const getUserFunds = async (userId, session) => {
  return await Fund.findOne({ userId }).session(session);
};

// Available balance check karne ke liye
export const checkAvailableBalance = (fund, amount) => {
  if (!fund) {
    throw new AppError("Funds record not found",404);
  }

  if (fund.availableBalance < amount) {
    throw new AppError("Insufficient available balance",400);
  }
};

// Funds document save karne ke liye
export const saveFunds = async (fund, session) => {
  return await fund.save({ session });
};