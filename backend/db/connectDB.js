import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
      const mongoUri = process.env.MONGO_URI?.trim();

      if (!mongoUri) {
            throw new Error("MONGO_URI is not set. Add it to backend/.env.");
      }

      await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10_000,
      });
};

export default connectDB;