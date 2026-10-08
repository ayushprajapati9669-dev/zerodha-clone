import mongoose from "mongoose";

const notificationPreferenceSchema =
      new mongoose.Schema(
            {
                  userId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "User",
                        required: true,
                        unique: true,
                  },

                  orderPlaced: {
                        type: Boolean,
                        default: true,
                  },

                  orderExecuted: {
                        type: Boolean,
                        default: true,
                  },

                  orderCancelled: {
                        type: Boolean,
                        default: true,
                  },

                  fundAdded: {
                        type: Boolean,
                        default: true,
                  },

                  fundWithdrawn: {
                        type: Boolean,
                        default: true,
                  },

                  system: {
                        type: Boolean,
                        default: true,
                  },

                  security: {
                        type: Boolean,
                        default: true,
                  },
            },
            {
                  timestamps: true,
            },
      );

export default notificationPreferenceSchema;