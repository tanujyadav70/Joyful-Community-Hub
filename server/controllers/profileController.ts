import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Profile } from "../models/Profile";
import { User } from "../models/User";
import { Post } from "../models/Post";
import { Like } from "../models/Like";
import { ConnectionRequest } from "../models/ConnectionRequest";
import { EventQuest } from "../models/EventQuest";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

/**
 * Centralized function to calculate Joy Score (HP Points) for a user
 * This ensures consistency across all components
 */
export async function calculateJoyScore(userId: string): Promise<number> {
  try {
    // Get posts count and points (5 points per post)
    const postsCount = await Post.countDocuments({ userId });
    const postsPoints = postsCount * 5;

    // Get likes received on user's posts (2 points per like)
    const userPosts = await Post.find({ userId }).select('_id');
    const postIds = userPosts.map((post: any) => post._id);
    const totalLikes = await Like.countDocuments({ postId: { $in: postIds } });
    const likesPoints = totalLikes * 2;

    // Get quest participation points (sum of quest points for joined quests)
    const questsPointsResult = await EventQuest.aggregate([
      { $match: { applications: userId } },
      { $group: { _id: null, total: { $sum: "$points" } } }
    ]);
    const questsPoints = questsPointsResult[0]?.total || 0;

    // Get event organization points (30 points per organized event)
    const eventsOrganized = await EventQuest.countDocuments({ organizerId: userId });
    const eventsPoints = eventsOrganized * 30;

    // Get connection points (5 points per accepted connection)
    const connectionsCount = await ConnectionRequest.countDocuments({
      $or: [
        { senderId: userId, status: 'accepted' },
        { receiverId: userId, status: 'accepted' }
      ]
    });
    const connectionsPoints = connectionsCount * 5;

    // Calculate total
    const totalPoints = postsPoints + likesPoints + questsPoints + eventsPoints + connectionsPoints;

    // Update stored value for future queries
    await Profile.findOneAndUpdate(
      { userId },
      { happinessPoints: totalPoints },
      { upsert: true }
    );

    return totalPoints;
  } catch (error) {
    console.error('Error calculating Joy Score:', error);
    // Fallback to stored value if calculation fails
    const profile = await Profile.findOne({ userId });
    return profile?.happinessPoints || 0;
  }
}

export async function getJoyScore(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const joyScore = await calculateJoyScore(userId as string);
    res.json({ joyScore });
  } catch (error) {
    console.error('Error getting Joy Score:', error);
    res.status(500).json({ message: "Failed to calculate Joy Score" });
  }
}

export async function getProfile(req: Request, res: Response) {
  const { id } = req.params;
  let userId = id as string;
  if (id === "me") {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    userId = req.session.userId;
  }

  // Calculate fresh Joy Score instead of using stored value
  const happinessPoints = await calculateJoyScore(userId);

  const profileDoc = await Profile.findOne({ userId });
  if (!profileDoc) {
    return res.status(404).json({ message: "Profile not found" });
  }

  // include user display name from User collection
  const { User } = await import("../models/User");
  const user = await User.findById(userId).select("name username technicalSkills generalSkills");

  const result = {
    id: userId,
    name: user?.name || user?.username || "",
    major: profileDoc.major,
    location: profileDoc.location,
    portfolio: profileDoc.portfolio,
    happinessPoints, // Use calculated value
    skillTags: profileDoc.skillTags,
    vibeBio: profileDoc.vibeBio,
    loveNotes: profileDoc.loveNotes,
    profileImage: profileDoc.profileImage,
    technicalSkills: user?.technicalSkills || [],
    generalSkills: user?.generalSkills || [],
  };

  res.json(result);
}

export async function addLove(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params; // user id
    const { name, text } = req.body;
    const profile = await Profile.findOne({ userId: id });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    profile.loveNotes.push({ name, text, avatar: name.split(" ").map((p: string) => p.charAt(0).toUpperCase()).join("").slice(0,2) || "JU" });
    await profile.save();
    res.status(201).json(profile.loveNotes[profile.loveNotes.length-1]);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, vibeBio, major, location, portfolio, technicalSkills, generalSkills } = req.body;

    // Update user name and skills if provided
    if (name || technicalSkills || generalSkills) {
      const updateData: any = {};
      if (name) updateData.name = name;
      if (technicalSkills) updateData.technicalSkills = technicalSkills;
      if (generalSkills) updateData.generalSkills = generalSkills;
      await User.findByIdAndUpdate(userId, updateData);
    }

    // Update profile
    const profile = await Profile.findOneAndUpdate(
      { userId },
      { 
        vibeBio: vibeBio || "",
        major: major || "",
        location: location || "",
        portfolio: portfolio || "",
      },
      { new: true, upsert: true }
    );

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: "Failed to update profile" });
  }
}

export async function getUserStats(req: Request, res: Response) {
  try {
    const { id } = req.params;
    let userId = id;
    if (id === "me") {
      if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
      userId = req.session.userId;
    }

    // Get posts count
    const postsCount = await Post.countDocuments({ userId });

    // Get connections count (accepted connections)
    const connectionsCount = await ConnectionRequest.countDocuments({
      $or: [
        { senderId: userId, status: 'accepted' },
        { receiverId: userId, status: 'accepted' }
      ]
    });

    // Get pending requests received
    const pendingRequestsReceived = await ConnectionRequest.countDocuments({
      receiverId: userId,
      status: 'pending'
    });

    // Get sent requests pending
    const sentRequestsPending = await ConnectionRequest.countDocuments({
      senderId: userId,
      status: 'pending'
    });

    // Get total likes received on user's posts
    const userPosts = await Post.find({ userId }).select('_id');
    const postIds = userPosts.map((post: any) => post._id);
    const totalLikes = await Like.countDocuments({ postId: { $in: postIds } });

    res.json({
      postsCount,
      connectionsCount,
      totalLikes,
      pendingRequestsReceived,
      sentRequestsPending,
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ message: "Failed to get user stats" });
  }
}

export async function getUserPosts(req: Request, res: Response) {
  try {
    const { id } = req.params;
    let userId = id;
    if (id === "me") {
      if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
      userId = req.session.userId;
    }

    const posts = await Post.find({ userId }).sort({ createdAt: -1 });

    const transformed = await Promise.all(posts.map(async (post: any) => {
      // Get author info, avoiding cast errors if userId is not an ObjectId
      let authorName = "Anonymous";
      if (mongoose.Types.ObjectId.isValid(post.userId)) {
        try {
          const user = await User.findById(post.userId).select("name username");
          authorName = user?.name || user?.username || "Anonymous";
        } catch (e) {
          console.warn("getUserPosts: failed to lookup user", post.userId, e);
        }
      } else {
        if (post.userId === "admin") {
          authorName = "Administrator";
        } else {
          authorName = "Unknown";
        }
      }
      const authorAvatar = authorName
        .split(" ")
        .map((p: string) => p.charAt(0).toUpperCase())
        .join("")
        .slice(0, 2);

      // Get comment count
      const commentCount = await (await import("../models/Comment")).Comment.countDocuments({ postId: post.id });

      // Get like count
      const likeCount = await Like.countDocuments({ postId: post.id });

      // Check if current user liked this post
      let userLiked = false;
      if (req.session?.userId) {
        const like = await Like.findOne({ postId: post.id, userId: req.session.userId });
        userLiked = !!like;
      }

      return {
        id: post.id,
        author: {
          name: authorName,
          avatar: authorAvatar,
          role: "Member",
        },
        type: post.mediaType ? post.mediaType.charAt(0).toUpperCase() + post.mediaType.slice(1) : "Text",
        content: post.text,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        likes: likeCount,
        comments: commentCount,
        time: new Date(post.createdAt).toLocaleDateString(),
        gradient: "from-purple-400 to-pink-500",
        userLiked,
      };
    }));

    res.json(transformed);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: "Failed to fetch user posts" });
  }
}

export async function uploadAvatar(req: Request, res: Response) {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!(req as any).file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Create uploads directory if it doesn't exist
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const uploadsDir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname((req as any).file.originalname);
    const fileName = `${userId}_${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Write file to disk
    fs.writeFileSync(filePath, (req as any).file.buffer);

    // Create URL for the image
    const imageUrl = `/uploads/avatars/${fileName}`;

    // Update profile with new image URL
    const profile = await Profile.findOneAndUpdate(
      { userId },
      { profileImage: imageUrl },
      { new: true, upsert: true }
    );

    res.json({
      message: "Avatar uploaded successfully",
      profileImage: imageUrl
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ message: "Failed to upload avatar" });
  }
}

export async function getStudentDashboard(req: Request, res: Response) {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get user info
    const user = await User.findById(userId).select("name username");
    const name = user?.name || user?.username || "Joyful User";

    // Get profile document
    const profileDoc = await Profile.findOne({ userId });

    // Use centralized Joy Score calculation
    const happinessPoints = await calculateJoyScore(userId);

    // Calculate level (simple: level = floor(points / 100) + 1)
    const level = Math.floor(happinessPoints / 100) + 1;
    const nextLevelPoints = level * 100;
    const currentLevelPoints = (level - 1) * 100;
    const nextLevelPercent = Math.min(((happinessPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100, 100);

    // Get stats
    const postsCount = await Post.countDocuments({ userId });
    const connectionsCount = await ConnectionRequest.countDocuments({
      $or: [
        { senderId: userId, status: 'accepted' },
        { receiverId: userId, status: 'accepted' }
      ]
    });

    // Get total likes received
    const userPosts = await Post.find({ userId }).select('_id');
    const postIds = userPosts.map((post: any) => post._id);
    const totalLikes = await Like.countDocuments({ postId: { $in: postIds } });

    // Get quests joined
    const questsJoined = await EventQuest.countDocuments({ applications: userId });

    // Get events organized
    const eventsOrganized = await EventQuest.countDocuments({ organizerId: userId });

    // Calculate individual point components for breakdown
    const postsPoints = postsCount * 5;
    const likesPoints = totalLikes * 2;
    const eventsPoints = eventsOrganized * 30;
    const connectionsPoints = connectionsCount * 5;

    // Get quest participation points
    const questsPointsResult = await EventQuest.aggregate([
      { $match: { applications: userId } },
      { $group: { _id: null, total: { $sum: "$points" } } }
    ]);
    const questsPointsTotal = questsPointsResult[0]?.total || 0;

    // Determine badges
    const badges = [];
    if (postsCount >= 1) badges.push({ name: "Joy Starter", icon: "🌱", color: "from-green-400 to-emerald-500" });
    if (postsCount >= 5) badges.push({ name: "Happiness Spreader", icon: "🌟", color: "from-yellow-400 to-orange-500" });
    if (postsCount >= 10) badges.push({ name: "Content Creator", icon: "🚀", color: "from-blue-400 to-purple-500" });
    if (connectionsCount >= 10) badges.push({ name: "Community Builder", icon: "🤝", color: "from-pink-400 to-red-500" });
    if (happinessPoints >= 200) badges.push({ name: "Joy Champion", icon: "🏆", color: "from-gold-400 to-yellow-500" });

    // Get leaderboard (top 10) - efficiently calculate points for all users
    // First, get all profiles with user info
    const allProfiles = await Profile.find({}).populate('userId', 'name username');

    // Calculate Joy Score for each user using centralized function
    const leaderboardPromises = allProfiles
      .filter((profile: any) => profile.userId && profile.userId._id) // Filter out profiles with null userId
      .map(async (profile: any) => {
        const userId = profile.userId._id.toString();
        const totalPoints = await calculateJoyScore(userId);

        return {
          profile,
          totalPoints,
          user: profile.userId
        };
      });

    const leaderboardData = await Promise.all(leaderboardPromises);

    // Sort by total points and take top 10
    leaderboardData.sort((a: any, b: any) => b.totalPoints - a.totalPoints);
    const top10Leaderboard = leaderboardData.slice(0, 10);

    const leaderboard = top10Leaderboard.map((item: any, index: number) => {
      const user = item.user as any;
      const name = user?.name || user?.username || "Anonymous";
      const avatar = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
      return {
        rank: index + 1,
        name,
        avatar,
        score: item.totalPoints,
      };
    });

    // Get total users for ranking
    const totalUsers = leaderboardData.length;

    // Calculate user's rank based on calculated points
    let userRank = 1;
    for (const item of leaderboardData) {
      if (item.totalPoints > happinessPoints) {
        userRank++;
      }
    }
    const rank = userRank;

    // Upcoming quests (dummy for now)
    const upcoming = [
      { title: "Sunset Yoga", time: "Today, 6 PM", type: "Meditation" },
      { title: "Hackathon Prep", time: "Tomorrow, 2 PM", type: "Coding" },
    ];

    // Activity data for graphs
    // Weekly activity: posts per week
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const postsThisWeek = await Post.countDocuments({ userId, createdAt: { $gte: weekAgo } });

    // Contribution breakdown
    const totalActivities = postsCount + connectionsCount + totalLikes;
    const postPercent = totalActivities > 0 ? (postsCount / totalActivities) * 100 : 0;
    const connectionPercent = totalActivities > 0 ? (connectionsCount / totalActivities) * 100 : 0;
    const likePercent = totalActivities > 0 ? (totalLikes / totalActivities) * 100 : 0;

    // Joy growth (simple: assume linear for demo)
    const growthData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      // In real app, would query historical points
      const points = Math.max(0, happinessPoints - (6 - i) * 10);
      growthData.push({ date: date.toISOString().split('T')[0], points });
    }

    res.json({
      name,
      level,
      quote: '"Spreading positive vibes since Day 1! 🌻"',
      happinessPoints: happinessPoints, // Use calculated points instead of stored
      profileImage: profileDoc?.profileImage, // Add profile image
      rankPercent: Math.max(1, Math.min(100, 100 - (rank / totalUsers) * 100)),
      nextLevelPercent,
      upcoming,
      badges,
      activityData: {
        weeklyPosts: postsThisWeek,
        contributionBreakdown: [
          { name: 'Posts', value: postPercent },
          { name: 'Connections', value: connectionPercent },
          { name: 'Likes Received', value: likePercent },
        ],
        joyGrowth: growthData,
        pointsBreakdown: {
          questsJoined: { count: questsJoined, points: questsPointsTotal },
          postsShared: { count: postsCount, points: postsPoints },
          likesReceived: { count: totalLikes, points: likesPoints },
          eventsOrganized: { count: eventsOrganized, points: eventsPoints },
        },
        rank,
        totalUsers,
        leaderboard,
      },
    });
  } catch (error) {
    console.error('Error getting student dashboard:', error);
    res.status(500).json({ message: "Failed to get dashboard data" });
  }
}