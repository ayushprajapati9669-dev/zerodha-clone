import mongoose from 'mongoose';
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
      try {
            await mongoose.connect(process.env.MONGO_URI);
            console.log("database connect successfully");
      } catch (err) {
            console.log("some error in db: ", err);
      }
}
export default connectDB;