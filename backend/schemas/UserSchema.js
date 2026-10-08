
import { Schema } from "mongoose";

const userSchema = new Schema(
      {
            name: {
                  type: String,
                  required: true,
                  trim: true,
                  minlength: 2,
                  maxlength: 50,
            },

            email: {
                  type: String,
                  required: true,
                  unique: true,
                  lowercase: true,
                  trim: true,
            },

            mobile: {
                  type: String,
                  required: true,
                  unique: true,
                  trim: true,
            },

            password: {
                  type: String,
                  minlength: 8,
                  required: true,
                  select: false,
            },

            // NEW
            clientId: {
                  type: String,
                  required: true,
                  unique: true,
                  uppercase: true,
                  trim: true,
            },

            // NEW
            status: {
                  type: String,
                  enum: ["active", "blocked"],
                  default: "active",
            },

            role: {
                  type: String,
                  enum: ["user", "admin"],
                  default: "user",
            },
            tokenVersion: {
                  type: Number,
                  default: 0,
            },
            lastLogin: {
                  type: Date,
            },
      },
      { timestamps: true }
);
export default userSchema;