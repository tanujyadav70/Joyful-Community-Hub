// @ts-nocheck
import { Schema, model, Document } from "mongoose";

export interface IComment extends Document {
  postId: string;
  userId: string;
  text: string;
  createdAt: Date;
}

const commentSchema = new Schema<IComment>({
  postId: { type: String, required: true },
  userId: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Comment = model<IComment>("Comment", commentSchema);