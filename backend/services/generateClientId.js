import crypto from "crypto";
import User from "../models/UserModel.js";

const generateClientId = async () => {
      let clientId;
      let exists = true;

      while (exists) {
            clientId = crypto
                  .randomBytes(4)
                  .toString("hex")
                  .toUpperCase();

            exists = await User.exists({
                  clientId,
            });
      }

      return clientId;
};

export default generateClientId;