// @ts-nocheck
import { Schema, model, Document } from "mongoose";

export interface IProfileLoveNote {
  name: string;
  text: string;
  avatar: string;
}

export interface IProfile extends Document {
  userId: string;
  major: string;
  location: string;
  portfolio: string;
  happinessPoints: number;
  skillTags: string[];
  vibeBio: string;
  loveNotes: IProfileLoveNote[];
  profileImage?: string;
  pendingRequestsReceived?: number;
  sentRequestsPending?: number;
}

const loveNoteSchema = new Schema<IProfileLoveNote>({
  name: { type: String, required: true },
  text: { type: String, required: true },
  avatar: { type: String, required: true },
});

const profileSchema = new Schema<IProfile>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  major: { type: String, default: "" },
  location: { type: String, default: "" },
  portfolio: { type: String, default: "" },
  happinessPoints: { type: Number, default: 0 },
  skillTags: { type: [String], default: [] },
  vibeBio: { type: String, default: "" },
  loveNotes: { type: [loveNoteSchema], default: [] },
  profileImage: { type: String, default: "" },
  pendingRequestsReceived: { type: Number, default: 0 },
  sentRequestsPending: { type: Number, default: 0 },
});

export const Profile = model<IProfile>("Profile", profileSchema);