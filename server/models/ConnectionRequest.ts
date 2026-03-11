// @ts-nocheck
import { Schema, model, Document } from "mongoose";

export interface IConnectionRequest extends Document {
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

const connectionRequestSchema = new Schema<IConnectionRequest>({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

// Ensure no duplicate requests between same users
connectionRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

export const ConnectionRequest = model<IConnectionRequest>("ConnectionRequest", connectionRequestSchema);