import mongoose from "mongoose";

const MAX_WATCHLISTS_PER_USER = 10;
const MAX_SYMBOLS_PER_WATCHLIST = 50;

const watchlistListSchema = new mongoose.Schema(
      {
            userId: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: "User",
                  required: true,
                  index: true,
            },

            name: {
                  type: String,
                  required: true,
                  trim: true,
                  minlength: 1,
                  maxlength: 40,
            },

            // Ordered list of { symbol, companyName }
            symbols: {
                  type: [
                        {
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
                              addedAt: {
                                    type: Date,
                                    default: Date.now,
                              },
                        },
                  ],
                  default: [],
                  validate: {
                        validator(v) {
                              return v.length <= MAX_SYMBOLS_PER_WATCHLIST;
                        },
                        message: `A watchlist can contain at most ${MAX_SYMBOLS_PER_WATCHLIST} symbols.`,
                  },
            },

            isDefault: {
                  type: Boolean,
                  default: false,
            },
      },
      {
            timestamps: true,
      },
);

// One user cannot have two watchlists with the same name
watchlistListSchema.index({ userId: 1, name: 1 }, { unique: true });

export { MAX_WATCHLISTS_PER_USER, MAX_SYMBOLS_PER_WATCHLIST };
export default watchlistListSchema;
