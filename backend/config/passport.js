import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import User from "../models/UserModel.js";

// Passport Local Strategy
passport.use(
      new LocalStrategy(
            {
                  usernameField: "email",
                  passwordField: "password",
                  session: false,
            },
            async (email, password, done) => {
                  try {
                        // 1. Email se user find karna
                        // Password par select:false hai, isliye explicitly select karenge
                        const user = await User.findOne({
                              email: email.toLowerCase().trim(),
                        }).select("+password");

                        // User nahi mila
                        if (!user) {
                              return done(null, false, {
                                    message: "Invalid email or password",
                              });
                        }

                        // 2. Entered password ko hashed password se compare karna
                        const isPasswordCorrect = await bcrypt.compare(
                              password,
                              user.password
                        );

                        // Password incorrect
                        if (!isPasswordCorrect) {
                              return done(null, false, {
                                    message: "Invalid email or password",
                              });
                        }

                        // 3. Authentication successful
                        // User object ko next middleware/controller ko dena
                        return done(null, user);
                  } catch (error) {
                        return done(error);
                  }
            }
      )
);

export default passport;