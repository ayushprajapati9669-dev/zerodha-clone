import mongoose from "mongoose";
import ordersSchema from "../schemas/OrdersSchema.js";
const Order = mongoose.model("Order", ordersSchema);
export default Order;