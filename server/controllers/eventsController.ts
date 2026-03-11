import { Request, Response, NextFunction } from "express";
import { EventQuest } from "../models/EventQuest";
import { Profile } from "../models/Profile";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Extend Request interface to include multer file (using any to avoid typing issues)
declare global {
  namespace Express {
    interface Request {
      file?: any;
    }
  }
}

export async function getEvents(req: Request, res: Response) {
  const events = await EventQuest.find().sort({ createdAt: -1 });
  // convert to simple objects with `id` property for frontend
  const transformed = events.map((e: any) => ({
    id: e._id.toString(),
    title: e.title,
    category: e.category,
    date: e.date,
    time: e.time,
    location: e.location,
    attendees: e.attendees,
    points: e.points,
    gradient: e.gradient,
    image: e.image,
  }));
  res.json(transformed);
}

export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    // include optional `date` field (due date) from the request body
    const { title, category, points, time, location, date } = req.body;
    // ensure only admin can create quests
    if (!req.session?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    const organizerId = req.session?.userId;
    let imageUrl = "";

    // Handle image upload if present
    if (req.file) {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const uploadsDir = path.join(__dirname, '../../uploads/events');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      // Write file to disk
      fs.writeFileSync(filePath, req.file.buffer);

      // Create URL for the image
      imageUrl = `/uploads/events/${fileName}`;
    }

    const event = new EventQuest({
      title,
      category,
      points,
      // store provided date or fallback to current time
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      time: time || "",
      location: location || "",
      attendees: 0,
      image: imageUrl,
      organizerId,
    });
    await event.save();
    
    // Award points to organizer
    // Award points to organizer (admin also gets points via their profile)
    if (organizerId) {
      await Profile.findOneAndUpdate({ userId: organizerId }, { $inc: { happinessPoints: 30 } }, { upsert: true });
    }
    
    // send mapped object as well
    res.status(201).json({
      id: event._id.toString(),
      title: event.title,
      category: event.category,
      date: event.date,
      time: event.time,
      location: event.location,
      attendees: event.attendees,
      points: event.points,
      gradient: event.gradient,
      image: event.image,
    });
  } catch (err) {
    next(err);
  }
}

// increment attendees count for a given event
export async function applyToEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const event = await EventQuest.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user already applied
    if (event.applications.includes(userId)) {
      return res.status(400).json({ message: "Already applied to this event" });
    }

    // Update the event using findOneAndUpdate to avoid validation issues
    const updatedEvent = await EventQuest.findByIdAndUpdate(
      id,
      {
        $push: { applications: userId },
        $inc: { attendees: 1 }
      },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Award points to the user
    await Profile.findOneAndUpdate({ userId }, { $inc: { happinessPoints: event.points } }, { upsert: true });

    res.json({
      id: updatedEvent._id.toString(),
      title: updatedEvent.title,
      category: updatedEvent.category,
      date: updatedEvent.date,
      time: updatedEvent.time,
      location: updatedEvent.location,
      attendees: updatedEvent.attendees,
      points: updatedEvent.points,
      gradient: updatedEvent.gradient,
      image: updatedEvent.image,
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserApplications(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find all events where the user has applied
    const appliedEvents = await EventQuest.find({ applications: userId });
    const appliedEventIds = appliedEvents.map((event: any) => event._id.toString());

    res.json(appliedEventIds);
  } catch (err) {
    next(err);
  }
}

export async function deleteEvent(req: Request, res: Response, next: NextFunction) {
  try {
    // admin only
    if (!req.session?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    const { id } = req.params;

    // Find the event
    const event = await EventQuest.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user is the organizer
    const userId = (req as any).user?.id || req.session?.userId;
    // only the original organizer or admin may delete
    if (event.organizerId.toString() !== userId && !req.session?.isAdmin) {
      return res.status(403).json({ message: "Only the event organizer can delete this event" });
    }

    // Delete the event
    await EventQuest.findByIdAndDelete(id);

    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    next(err);
  }
}