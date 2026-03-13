import { Request, Response, NextFunction } from "express";
import { Post } from "../models/Post";
import { Comment } from "../models/Comment";
import { Like } from "../models/Like";
import { User } from "../models/User";
import mongoose from "mongoose";
import { Profile } from "../models/Profile";

export async function getPosts(req: Request, res: Response) {
  try {
    // fetch all posts from database and sort newest first
    const posts = await Post.find().sort({ createdAt: -1 });
    console.log(`getPosts: found ${posts.length} posts in database`);

    const transformed: any[] = [];

    // Process each post defensively so one bad document doesn't break the whole feed
    for (const post of posts as any[]) {
      try {
        // Get author info but guard against invalid IDs (e.g. legacy "admin" string)
        let authorName = "Anonymous";
        if (mongoose.Types.ObjectId.isValid(post.userId)) {
          try {
            const user = await User.findById(post.userId).select("name username");
            authorName = user?.name || user?.username || "Anonymous";
          } catch (e) {
            console.warn("getPosts: failed to lookup user", post.userId, e);
          }
        } else {
          // handle special non-objectId values gracefully
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
        const commentCount = await Comment.countDocuments({ postId: post.id });

        // Get like count
        const likeCount = await Like.countDocuments({ postId: post.id });

        // Check if current user liked this post
        let userLiked = false;
        if (req.session?.userId) {
          const like = await Like.findOne({ postId: post.id, userId: req.session.userId });
          userLiked = !!like;
        }

        transformed.push({
          id: post.id,
          author: {
            name: authorName,
            avatar: authorAvatar,
            role: "Member",
            userId: post.userId,
          },
          type: post.mediaType
            ? post.mediaType.charAt(0).toUpperCase() + post.mediaType.slice(1)
            : "Text",
          content: post.text,
          mediaUrl: post.mediaUrl,
          mediaType: post.mediaType,
          likes: likeCount,
          comments: commentCount,
          time: new Date(post.createdAt).toLocaleDateString(),
          gradient: "from-purple-400 to-pink-500",
          userLiked,
        });
      } catch (postError) {
        console.error("getPosts: skipping malformed post", post?.id, postError);
      }
    }

    console.log(`getPosts: returning ${transformed.length} transformed posts`);
    res.json(transformed);
  } catch (error) {
    // eagerly log error and return empty list instead of 500 so that the
    // frontend doesn't drop into an error state and lose its local cache.
    console.error('Error fetching posts:', error);
    return res.json([]);
  }
}

export async function createPost(req: Request, res: Response, next: NextFunction) {
  try {
    const { text } = req.body;
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!text?.trim()) {
      return res.status(400).json({ message: "Text content is required" });
    }

    let mediaUrl: string | undefined;
    let mediaType: 'image' | 'video' | 'audio' | undefined;

    // Handle file upload
    if ((req as any).file) {
      const file = (req as any).file as any;
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'video/webm', 'audio/mp3', 'audio/wav'];

      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: "Invalid file type" });
      }

      // For now, store as base64. In production, you'd upload to cloud storage
      const base64 = file.buffer.toString('base64');
      mediaUrl = `data:${file.mimetype};base64,${base64}`;

      if (file.mimetype.startsWith('image/')) {
        mediaType = 'image';
      } else if (file.mimetype.startsWith('video/')) {
        mediaType = 'video';
      } else if (file.mimetype.startsWith('audio/')) {
        mediaType = 'audio';
      }
    }

    const post = new Post({
      userId,
      text: text.trim(),
      mediaUrl,
      mediaType,
    });

    await post.save();
    console.log(`createPost: saved post ${post.id} for user ${userId}`);

    // Award Joy Points for sharing a post
    await Profile.findOneAndUpdate({ userId }, { $inc: { happinessPoints: 5 } }, { upsert: true });

    // Get the transformed post for response
    const user = await User.findById(userId).select("name username");
    const authorName = user?.name || user?.username || "Anonymous";
    const authorAvatar = authorName
      .split(" ")
      .map((p: string) => p.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);

    const transformed = {
      id: post.id,
      author: {
        name: authorName,
        avatar: authorAvatar,
        role: "Member",
      },
      type: mediaType ? mediaType.charAt(0).toUpperCase() + mediaType.slice(1) : "Text",
      content: post.text,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      likes: 0,
      comments: 0,
      time: new Date(post.createdAt).toLocaleDateString(),
      gradient: "from-purple-400 to-pink-500",
      userLiked: false,
    };

    res.status(201).json(transformed);
  } catch (err) {
    console.error('Error creating post:', err);
    next(err);
  }
}

export async function getComments(req: Request, res: Response) {
  try {
    const postId = req.params.postId;
    const comments = await Comment.find({ postId }).sort({ createdAt: 1 });

    const transformed = await Promise.all(comments.map(async (comment: any) => {
      const user = await User.findById(comment.userId).select("name username");
      const authorName = user?.name || user?.username || "Anonymous";

      return {
        id: comment.id,
        postId: comment.postId,
        author: {
          name: authorName,
        },
        text: comment.text,
        time: new Date(comment.createdAt).toLocaleString(),
      };
    }));

    res.json(transformed);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
}

export async function createComment(req: Request, res: Response) {
  try {
    const postId = req.params.postId;
    const { text } = req.body;
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!text?.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = new Comment({
      postId,
      userId,
      text: text.trim(),
    });

    await comment.save();

    const user = await User.findById(userId).select("name username");
    const authorName = user?.name || user?.username || "Anonymous";

    const transformed = {
      id: comment.id,
      postId: comment.postId,
      author: {
        name: authorName,
      },
      text: comment.text,
      time: new Date(comment.createdAt).toLocaleString(),
    };

    res.status(201).json(transformed);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: "Failed to create comment" });
  }
}

export async function toggleLike(req: Request, res: Response) {
  try {
    const postId = req.params.postId;
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if like already exists
    const existingLike = await Like.findOne({ postId, userId });

    if (existingLike) {
      // Unlike
      await Like.deleteOne({ _id: existingLike._id });
      res.json({ liked: false });
    } else {
      // Like
      const like = new Like({ postId, userId });
      await like.save();

      // Award Joy Points to the post author (if not self-like)
      if (post.userId !== userId) {
        await Profile.findOneAndUpdate({ userId: post.userId }, { $inc: { happinessPoints: 2 } }, { upsert: true });
      }

      res.json({ liked: true });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: "Failed to toggle like" });
  }
}