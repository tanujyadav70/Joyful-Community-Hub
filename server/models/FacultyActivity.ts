// @ts-nocheck
import { Schema, model, Document } from "mongoose";

export interface IFacultyActivity extends Document {
  title: string;
  description: string;
  date: string;
  location: string;
  maxParticipants: number;
  participants: string[];
}

const facultyActivitySchema = new Schema<IFacultyActivity>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  location: { type: String, required: true },
  maxParticipants: { type: Number, required: true },
  participants: { type: [String], default: [] },
});

export const FacultyActivity = model<IFacultyActivity>("FacultyActivity", facultyActivitySchema);