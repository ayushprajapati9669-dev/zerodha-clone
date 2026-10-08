import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema(
      {
            userId: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: "User",
                  required: true,
                  index: true,
            },

            symbol: {
                  type: String,
                  required: true,
                  uppercase: true,
                  trim: true,
            },

            companyName: {
                  type: String,
                  required: true,
                  trim: true,
            },
      },
      {
            timestamps: true,
      },
);

// Same user same stock ko multiple times add nahi kar sake
watchlistSchema.index(
      { userId: 1, symbol: 1 },
      { unique: true }
);



export default watchlistSchema;