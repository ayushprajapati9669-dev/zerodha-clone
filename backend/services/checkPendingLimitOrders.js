import Order from "../models/OrdersModel.js";

import executeLimitOrder from "./limitOrderService/ExecuteLimitOrderService.js";


// =====================================================
// Check Pending Limit Orders
// =====================================================

export const checkPendingLimitOrders = async (
    symbol,
    currentPrice,
    previousClose
) => {

    try {

        // =====================================================
        // VALIDATION
        // =====================================================

        if (!symbol) {
            return;
        }


        if (
            typeof currentPrice !== "number" ||
            !Number.isFinite(currentPrice) ||
            currentPrice <= 0
        ) {
            return;
        }


        if (
            typeof previousClose !== "number" ||
            !Number.isFinite(previousClose) ||
            previousClose <= 0
        ) {
            return;
        }


        const normalizedSymbol =
            String(symbol)
                .trim()
                .toUpperCase();


        // =====================================================
        // FIND PENDING LIMIT ORDERS
        // =====================================================

        const pendingOrders =
            await Order.find({

                symbol:
                    normalizedSymbol,

                orderType:
                    "Limit",

                status:
                    "pending",

                reservationReleased:
                    false,

            }).select(
                "_id type price quantity userId"
            );


        if (
            pendingOrders.length === 0
        ) {
            return;
        }


        // =====================================================
        // CHECK EVERY ORDER
        // =====================================================

        for (
            const order of pendingOrders
        ) {

            let canExecute = false;


            // =================================================
            // BUY
            // =================================================
            //
            // Example:
            //
            // Limit = ₹3500
            // LTP = ₹3480
            //
            // 3480 <= 3500 => execute
            //

            if (
                order.type === "buy"
            ) {

                canExecute =
                    currentPrice <=
                    order.price;
            }


            // =================================================
            // SELL
            // =================================================
            //
            // Example:
            //
            // Limit = ₹3500
            // LTP = ₹3520
            //
            // 3520 >= 3500 => execute
            //

            else if (
                order.type === "sell"
            ) {

                canExecute =
                    currentPrice >=
                    order.price;
            }


            if (!canExecute) {
                continue;
            }


            // =================================================
            // CONDITION SATISFIED
            // =================================================



            // =================================================
            // EXECUTE
            // =================================================

            try {

                await executeLimitOrder(
                    order._id,
                    currentPrice,
                    previousClose
                );

            } catch (error) {

                console.error(
                    `Unable to execute limit order ${order._id}:`,
                    error.message
                );
            }
        }

    } catch (error) {

        console.error(
            `Pending limit order checker failed (${symbol}):`,
            error.message
        );
    }
};


export default checkPendingLimitOrders;