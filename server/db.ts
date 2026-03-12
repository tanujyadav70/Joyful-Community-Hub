import mongoose from "mongoose";

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/happiness-hub";

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    await mongoose.connect(uri, {
      // options can be added here if needed
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    const message =
      process.env.MONGO_URI
        ? "Error connecting to MongoDB"
        : "Error connecting to MongoDB (MONGO_URI not set; using localhost fallback)";
    console.error(message, err);
    throw err;
  }
}

export default mongoose;