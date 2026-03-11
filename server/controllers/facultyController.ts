import { Request, Response, NextFunction } from "express";
import { FacultyActivity } from "../models/FacultyActivity";

export async function getActivities(req: Request, res: Response) {
  const activities = await FacultyActivity.find();
  res.json(activities);
}

export async function createActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, description, date, location, maxParticipants } = req.body;
    const activity = new FacultyActivity({ title, description, date, location, maxParticipants, participants: [] });
    await activity.save();
    res.status(201).json(activity);
  } catch (err) {
    next(err);
  }
}

export async function updateActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const updated = await FacultyActivity.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Activity not found" });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteActivity(req: Request, res: Response) {
  const { id } = req.params;
  const deleted = await FacultyActivity.findByIdAndDelete(id);
  if (!deleted) {
    return res.status(404).json({ message: "Activity not found" });
  }
  res.status(204).send();
}

export async function getParticipants(req: Request, res: Response) {
  const { id } = req.params;
  const activity = await FacultyActivity.findById(id);
  if (!activity) {
    return res.status(404).json({ message: "Activity not found" });
  }
  res.json({ participants: activity.participants });
}