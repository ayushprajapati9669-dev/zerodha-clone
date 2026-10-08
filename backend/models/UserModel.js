import userSchema from "../schemas/UserSchema.js";
import mongoose from "mongoose";
const User = mongoose.model("User", userSchema)
export default User