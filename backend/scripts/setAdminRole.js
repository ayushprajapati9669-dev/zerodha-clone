import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/UserModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/zerodha_clone";

async function setAdminRole() {
  const target = process.argv[2];

  if (!target) {
    console.error("❌ Usage: node scripts/setAdminRole.js <email_or_mobile>");
    console.error("Example: node scripts/setAdminRole.js 9876543210");
    console.error("Example: node scripts/setAdminRole.js admin@example.com");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    const query = target.includes("@")
      ? { email: target.trim().toLowerCase() }
      : { mobile: target.trim().replace(/^\+91/, "") };

    const user = await User.findOne(query);

    if (!user) {
      console.error(`❌ No user found matching identifier: "${target}"`);
      process.exit(1);
    }

    user.role = "admin";
    await user.save();

    console.log("====================================================");
    console.log(`✅ Success! User promoted to admin:`);
    console.log(`   ID:       ${user._id}`);
    console.log(`   Name:     ${user.name}`);
    console.log(`   Email:    ${user.email}`);
    console.log(`   Mobile:   ${user.mobile}`);
    console.log(`   Role:     ${user.role}`);
    console.log("====================================================");
  } catch (err) {
    console.error("❌ Error setting admin role:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

setAdminRole();
