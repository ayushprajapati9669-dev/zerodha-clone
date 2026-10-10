
import Holding from "../models/HoldingsModel.js";
import connectDB from "../db/connectDB.js";
import Position from "../models/PositionsModel.js";
import FundTransaction from "../models/FundTransactionModel.js";
import data from "./data.js";
import Fund from "../models/FundsModel.js";
import Notification from "../models/NotificationModel.js";
const { ordersData, positionsData, holdingsData, fundsData, fundTransactionsData } = data;
import Order from "../models/OrdersModel.js";
import Tournament from "../models/TournamentModel.js";
import TournamentParticipation from "../models/TournamentParticipationModel.js";
import TournamentOrder from "../models/TournamentOrderModel.js";
const initHoldingsData = async () => {
      try {
            await connectDB();
            let response = await Holding.insertMany(holdingsData);
            console.log("data inserted successfully");
      } catch (err) {
            console.log("some error in db (initHoldingsData.js): ", err);
      }
}
const initPositionsData = async () => {
      try {
            await connectDB();
            let response = await Position.insertMany(positionsData);
            console.log("data inserted successfully");
      } catch (err) {
            console.log("some error in db (iniPositionsData.js): ", err);
      }
}
const initOrdersData = async () => {
      try {
            await connectDB();
            let response = await Order.insertMany(ordersData);
            console.log("data inserted successfully");
      } catch (err) {
            console.log("some error in db (iniOrderssData.js): ", err);
      }
}
const deleteOrdersData = async () => {
      try {
            await connectDB();
            let response = await Order.deleteMany({});
            console.log("data deleted successfully");
      } catch (err) {
            console.log("some error in db (deleteOrderssData.js): ", err);
      }
}
const deleteHoldingsData = async () => {
      try {
            await connectDB();
            let response = await Holding.deleteMany({});
            console.log("data deleted successfully");
      } catch (err) {
            console.log("some error in db (deleteHoldingsData.js): ", err);
      }
}
const deletePositionsData = async () => {
      try {
            await connectDB();
            let response = await Position.deleteMany({});
            console.log("data deleted successfully");
      } catch (err) {
            console.log("some error in db (deletePositionsData.js): ", err);
      }
}
const initFundsData = async () => {
      try {
            await connectDB();
            let response = await Fund.insertMany(fundsData);
            console.log("data inserted successfully");
      } catch (err) {
            console.log("some error in db (iniOrderssData.js): ", err);
      }
}
const initFundTransactionData = async () => {
      try {
            await connectDB();
            let response = await FundTransaction.insertMany(fundTransactionsData);
            console.log("data inserted successfully");
      } catch (err) {
            console.log("some error in db : ", err);
      }
}
const deleteFundsTransaction = async () => {
      try {
            await connectDB();
            let response = await FundTransaction.deleteMany({});
            console.log("data deleted successfully");
      } catch (err) {
            console.log("some error in db (deletePositionsData.js): ", err);
      }
}
const deleteFundsData = async () => {
      try {
            await connectDB();
            let response = await Fund.deleteMany({});
            console.log("data deleted successfully");
      } catch (err) {
            console.log("some error in db (deleteFundsData.js): ", err);
      }
}
const deleteNotificationsData = async () => {
      try {
            await connectDB();
            let response = await Notification.deleteMany({});
            console.log("data deleted successfully");
      } catch (err) {
            console.log("some error in db (deleteNotificationsData.js): ", err);
      }
}
const deleteTournamentsData = async () => {
      try {
            await connectDB();
            let response = await Tournament.deleteMany({});
            console.log("data deleted successfully");
      } catch (err) {
            console.log("some error in db (deleteTournamentsData.js): ", err);
      }
}
const deleteTournamentParticipationsData = async () => {
      try {
            await connectDB();
            let response = await TournamentParticipation.deleteMany({});
            console.log("data deleted successfully");
      } catch (err) {
            console.log("some error in db (deleteTournamentParticipationsData.js): ", err);
      }
}
const deleteTournamentOrdersData = async () => {
      try {
            await connectDB();
            let response = await TournamentOrder.deleteMany({});
            console.log("data deleted successfully");
      } catch (err) {
            console.log("some error in db (deleteTournamentOrdersData.js): ", err);
      }
}
// deleteOrdersData();
// deleteHoldingsData();
// deletePositionsData();
// deleteFundsTransaction();
// deleteFundsData();
// deleteNotificationsData();
deleteTournamentsData();
deleteTournamentParticipationsData();
deleteTournamentOrdersData();
