import mongoose from "mongoose";

const runTransaction = async (callback) => {
      const session = await mongoose.startSession();

      try {
            session.startTransaction();

            // Callback ke andar actual database operations chalenge
            const result = await callback(session);

            // Sab operations successful hue to commit
            await session.commitTransaction();

            return result;
      } catch (error) {
            // Error aane par rollback
            console.log("inside runTransaction=", error.message);
            if (session.inTransaction()) {
                  await session.abortTransaction();
            }

            throw error;
      } finally {
            // Session hamesha close hoga
            await session.endSession();
      }
};

export default runTransaction;