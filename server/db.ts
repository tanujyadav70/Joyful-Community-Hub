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
    console.error("Error connecting to MongoDB", err);
    process.exit(1);
  }
}

export default mongoose;