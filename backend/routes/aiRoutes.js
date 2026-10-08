import express from "express";
import isLoggedIn from "../middleware/isLoggedInMiddleware.js";
import {
      chatWithAI,
      getUserChats,
      getChatById,
      deleteChat,
} from "../controller/aiController.js";

const router = express.Router();

router.post(
      "/chat",
      isLoggedIn,
      chatWithAI,
);

router.get(
      "/chats",
      isLoggedIn,
      getUserChats,
);

router.get(
      "/chats/:chatId",
      isLoggedIn,
      getChatById,
);

router.delete(
      "/chats/:chatId",
      isLoggedIn,
      deleteChat,
);

export default router;