import mongoose from "mongoose";
import chatSchema from "../schemas/ChatSchema.js";
const Chat = mongoose.model("Chat", chatSchema);
export default Chat;