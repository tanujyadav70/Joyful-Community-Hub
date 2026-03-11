// @ts-nocheck
import { Schema, model, Document } from "mongoose";

export interface ILike extends Document {
  postId: string;
  userId: string;
  createdAt: Date;
}

const likeSchema = new Schema<ILike>({
  postId: { type: String, required: true },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Ensure a user can only like a post once
likeSchema.index({ postId: 1, userId: 1 }, { unique: true });

export const Like = model<ILike>("Like", likeSchema);