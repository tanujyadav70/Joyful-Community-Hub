// the entire file has been replaced with clean routing below

import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { z } from "zod";
import multer from "multer";

// Controllers
import * as authController from "./controllers/authController";
import * as eventsController from "./controllers/eventsController";
import * as facultyController from "./controllers/facultyController";
import * as postController from "./controllers/postController";
import * as profileController from "./controllers/profileController";
import * as connectionController from "./controllers/connectionController";
import { calculateJoyScore } from "./controllers/profileController";

// Models
import { User } from "./models/User";
import { Post } from "./models/Post";
import { EventQuest } from "./models/EventQuest";
import { ConnectionRequest } from "./models/ConnectionRequest";
import { Profile } from "./models/Profile";

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'video/mp4',
      'video/webm',
      'audio/mp3',
      'audio/wav'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Multer configuration for avatar uploads (images only)
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for avatars
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and WebP images are allowed.'));
    }
  },
});

// extend session to hold userId
declare module "express-session" {
  interface SessionData {
    userId?: string;
    // flag set when the session belongs to the configured administrator
    isAdmin?: boolean;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// ensure the current authenticated session is the admin user
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session?.isAdmin) {
    return next();
  }
  return res.status(403).json({ message: "Admin access required" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // AUTH
  app.post("/api/auth/register", authController.register);
  app.post("/api/auth/login", authController.login);
  app.get("/api/auth/me", authController.me);
  app.post("/api/auth/logout", authController.logout);

  // FEED
  app.get("/api/feed", postController.getPosts);
  app.post("/api/feed", requireAuth, upload.single('media'), postController.createPost);
  app.get("/api/posts/:postId/comments", requireAuth, postController.getComments);
  app.post("/api/posts/:postId/comments", requireAuth, postController.createComment);
  app.post("/api/posts/:postId/like", requireAuth, postController.toggleLike);

  // EVENTS
  app.get("/api/events", eventsController.getEvents);
  // only admin may create or delete quests
  app.post("/api/events", requireAuth, requireAdmin, upload.single('image'), eventsController.createEvent);
  app.post("/api/events/:id/apply", requireAuth, eventsController.applyToEvent);
  app.delete("/api/events/:id", requireAuth, requireAdmin, eventsController.deleteEvent);
  app.get("/api/events/user/applications", requireAuth, eventsController.getUserApplications);

  // STUDENT DASHBOARD
  app.get("/api/student/dashboard", requireAuth, profileController.getStudentDashboard);

  // ADMIN DASHBOARD (dynamic with calculated Joy Scores)
  // admin dashboard should obviously only be visible to the admin account as well
  app.get("/api/admin/dashboard", requireAuth, requireAdmin, async (req, res) => {
    try {
      // Get total users
      const totalUsers = await User.countDocuments();

      // Get total posts
      const totalPosts = await Post.countDocuments();

      // Get total events
      const totalEvents = await EventQuest.countDocuments();

      // Get total connections
      const totalConnections = await ConnectionRequest.countDocuments({ status: 'accepted' });

      // Get recent posts (last 5)
      const recentPosts = await Post.find({})
        .populate('userId', 'name username')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('content createdAt userId');

      // Get recent events (last 5)
      const recentEvents = await EventQuest.find({})
        .populate('organizerId', 'name username')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title description date organizerId');

      // Get top contributors (users with most posts)
      const topContributors = await Post.aggregate([
        {
          $group: {
            _id: "$userId",
            postCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $unwind: "$user"
        },
        {
          $project: {
            name: "$user.name",
            username: "$user.username",
            postCount: 1
          }
        },
        {
          $sort: { postCount: -1 }
        },
        {
          $limit: 5
        }
      ]);

      // Get top Joy Score users
      const allProfiles = await Profile.find({}).populate('userId', 'name username');
      const joyScorePromises = allProfiles
        .filter((profile: any) => profile.userId && profile.userId._id)
        .map(async (profile: any) => {
          const userId = profile.userId._id.toString();
          const totalPoints = await calculateJoyScore(userId);
          return {
            name: profile.userId.name || profile.userId.username,
            username: profile.userId.username,
            joyScore: totalPoints
          };
        });

      const joyScoreData = await Promise.all(joyScorePromises);
      const topJoyUsers = joyScoreData
        .sort((a: any, b: any) => b.joyScore - a.joyScore)
        .slice(0, 5);

      // Calculate metrics
      const totalJoyPoints = joyScoreData.reduce((sum: number, user: any) => sum + user.joyScore, 0);
      const activeStudents = totalUsers; // For now, assume all users are active

      const studentMetrics = [
        { title: "Total Joy Points", value: totalJoyPoints.toLocaleString(), icon: "TrendingUp", color: "text-amber-500", bg: "bg-amber-500/10", trend: "+120k this week" },
        { title: "Active Students", value: activeStudents.toString(), icon: "Users", color: "text-blue-500", bg: "bg-blue-500/10", trend: "+34 today" },
        { title: "Quests Completed", value: totalEvents.toString(), icon: "UserCheck", color: "text-emerald-500", bg: "bg-emerald-500/10", trend: "High engagement" },
      ];

      const activityLogs = [
        { time: "2m ago", text: "New post in 'Music Clips' trending." },
        { time: "15m ago", text: "50 students RSVP'd to Sunset Yoga." },
        { time: "1h ago", text: "Alex J. reached Level 50!" },
        { time: "3h ago", text: "Code Club created a new quest." },
      ];

      // Get all users with skills for Talent Scout
      const allUsers = await User.find({}).select('name username technicalSkills generalSkills');
      const usersWithSkills = await Promise.all(allUsers.map(async (user: any) => {
        const totalPoints = await calculateJoyScore(user._id.toString());
        return {
          id: user._id,
          name: user.name || user.username,
          username: user.username,
          technicalSkills: user.technicalSkills || [],
          generalSkills: user.generalSkills || [],
          joyScore: totalPoints
        };
      }));

      // apply single search query filtering across name and skills
      let filteredUsers = usersWithSkills;
      const q = (req.query.q as string | undefined)?.trim() ?? "";
      if (q) {
        const regex = new RegExp(q, 'i');
        filteredUsers = filteredUsers.filter(user => {
          return (
            regex.test(user.name) ||
            user.technicalSkills.some((s: string) => regex.test(s)) ||
            user.generalSkills.some((s: string) => regex.test(s))
          );
        });
      }

        // for backwards compat, we still compute filteredStudents (name only) but not used now
        const filteredStudents = filteredUsers.map(user => ({
              name: user.name,
              role: "Student",
              skills: [...user.technicalSkills, ...user.generalSkills],
              points: user.joyScore
            }));

      res.json({
        metrics: studentMetrics,
        students: filteredStudents,
        activity: activityLogs,
        recentPosts: recentPosts.map((post: any) => ({
          id: post._id,
          content: post.content,
          author: post.userId?.name || post.userId?.username || "Anonymous",
          createdAt: post.createdAt
        })),
        recentEvents: recentEvents.map((event: any) => ({
          id: event._id,
          title: event.title,
          description: event.description,
          organizer: event.organizerId?.name || event.organizerId?.username || "Anonymous",
          date: event.date
        })),
        topContributors,
        topJoyUsers,
        talentScoutUsers: filteredUsers
      });
    } catch (error) {
      console.error('Error getting admin dashboard:', error);
      res.status(500).json({ message: "Failed to get admin dashboard data" });
    }
  });

  // PROFILE
  app.get("/api/profile/:id", requireAuth, profileController.getProfile);
  app.get("/api/users/:userId/joy-score", requireAuth, profileController.getJoyScore);
  app.put("/api/profile/update", requireAuth, profileController.updateProfile);
  app.post("/api/profile/upload-avatar", requireAuth, avatarUpload.single('avatar'), profileController.uploadAvatar);
  app.get("/api/profile/stats/:id", requireAuth, profileController.getUserStats);
  app.get("/api/posts/user/:id", requireAuth, profileController.getUserPosts);
  app.post("/api/profile/:id/love", requireAuth, profileController.addLove);

  // CONNECTIONS
  app.post("/api/connect/request", requireAuth, connectionController.sendConnectionRequest);
  app.post("/api/connect/accept/:requestId", requireAuth, connectionController.acceptConnectionRequest);
  app.post("/api/connect/reject/:requestId", requireAuth, connectionController.rejectConnectionRequest);
  app.get("/api/connect/requests", requireAuth, connectionController.getConnectionRequests);
  app.get("/api/connect/status/:userId", requireAuth, connectionController.getConnectionStatus);
  app.get("/api/connect/connections/:userId", requireAuth, connectionController.getAcceptedConnections);

  return httpServer;
}
