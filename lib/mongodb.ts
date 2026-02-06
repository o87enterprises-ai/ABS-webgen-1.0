import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
// @ts-expect-error known issue with mongoose types
let cached = global.mongoose;

if (!cached) {
  // @ts-expect-error known issue with mongoose types
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  // Return null if MONGODB_URI is not configured
  if (!MONGODB_URI) {
    console.warn(
      "⚠️  MONGODB_URI is not configured. Database features will be unavailable."
    );
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI)
      .then((mongoose) => {
        return mongoose;
      })
      .catch((error) => {
        console.error("❌ Failed to connect to MongoDB:", error.message);
        return null;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
