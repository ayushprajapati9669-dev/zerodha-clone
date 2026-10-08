import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
      withCredentials: true,

      // AppContext currentUser milne ke baad manually connect karega
      autoConnect: false,

      reconnection: true,

      reconnectionAttempts: Infinity,

      reconnectionDelay: 1000,

      reconnectionDelayMax: 5000,
});

export default socket;