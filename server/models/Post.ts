// @ts-nocheck
import { Schema, model, Document } from "mongoose";

export interface IPost extends Document {
  userId: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  createdAt: Date;
}

const postSchema = new Schema<IPost>({
  userId: { type: String, required: true },
  text: { type: String, required: true },
  mediaUrl: { type: String },
  mediaType: { type: String, enum: ['image', 'video', 'audio'] },
  createdAt: { type: Date, default: Date.now },
});

export const Post = model<IPost>("Post", postSchema);