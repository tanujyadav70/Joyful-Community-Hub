// @ts-nocheck
import { Schema, model, Document } from "mongoose";

export interface IEventQuest extends Document {
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  points: number;
  gradient: string;
  image: string;
  organizerId: string;
  applications: string[]; // user IDs who applied
}

const eventQuestSchema = new Schema<IEventQuest>({
  title: { type: String, required: true },
  category: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  attendees: { type: Number, default: 0 },
  points: { type: Number, required: true },
  gradient: { type: String, default: "" },
  image: { type: String, default: "" },
  organizerId: { type: String, required: true },
  applications: { type: [String], default: [] },
}, { timestamps: true });

export const EventQuest = model<IEventQuest>("EventQuest", eventQuestSchema);