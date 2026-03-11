import { Request, Response } from "express";
import { ConnectionRequest } from "../models/ConnectionRequest";
import { Profile } from "../models/Profile";
import { User } from "../models/User";

export async function sendConnectionRequest(req: Request, res: Response) {
  try {
    const { receiverId } = req.body;
    const senderId = req.session?.userId;

    if (!senderId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ message: "Cannot connect to yourself" });
    }

    // Check if request already exists
    const existingRequest = await ConnectionRequest.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Connection request already exists" });
    }

    const request = new ConnectionRequest({
      senderId,
      receiverId,
      status: 'pending',
    });

    await request.save();

    // Update sender's sentRequestsPending
    await Profile.findOneAndUpdate(
      { userId: senderId },
      { $inc: { sentRequestsPending: 1 } },
      { upsert: true }
    );

    // Update receiver's pendingRequestsReceived
    await Profile.findOneAndUpdate(
      { userId: receiverId },
      { $inc: { pendingRequestsReceived: 1 } },
      { upsert: true }
    );

    res.status(201).json({
      id: request.id,
      status: request.status,
      createdAt: request.createdAt,
    });
  } catch (error) {
    console.error('Error sending connection request:', error);
    res.status(500).json({ message: "Failed to send connection request" });
  }
}

export async function acceptConnectionRequest(req: Request, res: Response) {
  try {
    const { requestId } = req.params;
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const request = await ConnectionRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Connection request not found" });
    }

    if (request.receiverId !== userId) {
      return res.status(403).json({ message: "Not authorized to accept this request" });
    }

    request.status = 'accepted';
    await request.save();

    // Update receiver's pendingRequestsReceived (decrease)
    await Profile.findOneAndUpdate(
      { userId: request.receiverId },
      { $inc: { pendingRequestsReceived: -1 } }
    );

    // Update sender's sentRequestsPending (decrease)
    await Profile.findOneAndUpdate(
      { userId: request.senderId },
      { $inc: { sentRequestsPending: -1 } }
    );

    // Award Joy Points for making a connection
    await Profile.findOneAndUpdate({ userId: request.receiverId }, { $inc: { happinessPoints: 5 } }, { upsert: true });
    await Profile.findOneAndUpdate({ userId: request.senderId }, { $inc: { happinessPoints: 5 } }, { upsert: true });

    res.json({
      id: request.id,
      status: request.status,
    });
  } catch (error) {
    console.error('Error accepting connection request:', error);
    res.status(500).json({ message: "Failed to accept connection request" });
  }
}

export async function rejectConnectionRequest(req: Request, res: Response) {
  try {
    const { requestId } = req.params;
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const request = await ConnectionRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Connection request not found" });
    }

    if (request.receiverId !== userId) {
      return res.status(403).json({ message: "Not authorized to reject this request" });
    }

    request.status = 'rejected';
    await request.save();

    // Update receiver's pendingRequestsReceived (decrease)
    await Profile.findOneAndUpdate(
      { userId: request.receiverId },
      { $inc: { pendingRequestsReceived: -1 } }
    );

    // Update sender's sentRequestsPending (decrease)
    await Profile.findOneAndUpdate(
      { userId: request.senderId },
      { $inc: { sentRequestsPending: -1 } }
    );

    res.json({
      id: request.id,
      status: request.status,
    });
  } catch (error) {
    console.error('Error rejecting connection request:', error);
    res.status(500).json({ message: "Failed to reject connection request" });
  }
}

export async function getConnectionRequests(req: Request, res: Response) {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const requests = await ConnectionRequest.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).sort({ createdAt: -1 });

    const transformed = await Promise.all(requests.map(async (request: any) => {
      const isIncoming = request.receiverId === userId;
      const requesterUserId = isIncoming ? request.senderId : request.receiverId;
      
      const requester = await User.findById(requesterUserId).select("name username");
      const requesterName = requester?.name || requester?.username || "Unknown User";
      const requesterAvatar = requesterName
        .split(" ")
        .map((p: string) => p.charAt(0).toUpperCase())
        .join("")
        .slice(0, 2);

      return {
        id: request.id,
        senderId: request.senderId,
        receiverId: request.receiverId,
        requesterName,
        requesterAvatar,
        requesterUserId,
        status: request.status,
        createdAt: request.createdAt,
        isIncoming,
      };
    }));

    res.json(transformed);
  } catch (error) {
    console.error('Error fetching connection requests:', error);
    res.status(500).json({ message: "Failed to fetch connection requests" });
  }
}

export async function getConnectionStatus(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const currentUserId = req.session?.userId;

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (currentUserId === userId) {
      return res.json({ status: 'self' });
    }

    // Check for existing connection request
    const request = await ConnectionRequest.findOne({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId }
      ]
    });

    if (!request) {
      return res.json({ status: 'none' });
    }

    res.json({
      status: request.status,
      isIncoming: request.receiverId === currentUserId,
      requestId: request.id
    });
  } catch (error) {
    console.error('Error getting connection status:', error);
    res.status(500).json({ message: "Failed to get connection status" });
  }
}

export async function getAcceptedConnections(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const currentUserId = req.session?.userId;
    const targetUserId = userId === "me" ? currentUserId : userId;

    if (!targetUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find all accepted connections where the user is either sender or receiver
    const connections = await ConnectionRequest.find({
      $or: [
        { senderId: targetUserId, status: 'accepted' },
        { receiverId: targetUserId, status: 'accepted' }
      ]
    }).sort({ createdAt: -1 });

    const transformed = await Promise.all(connections.map(async (connection: any) => {
      // Get the other user's ID
      const otherUserId = connection.senderId === targetUserId ? connection.receiverId : connection.senderId;
      const otherUser = await User.findById(otherUserId).select("name username");
      const profile = await Profile.findOne({ userId: otherUserId }).select("profileImage");

      const userName = otherUser?.name || otherUser?.username || "Unknown User";
      const userAvatar = userName
        .split(" ")
        .map((p: string) => p.charAt(0).toUpperCase())
        .join("")
        .slice(0, 2);

      return {
        userId: otherUserId,
        name: userName,
        avatar: userAvatar,
        profileImage: profile?.profileImage,
        connectedAt: connection.createdAt,
      };
    }));

    res.json(transformed);
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ message: "Failed to fetch connections" });
  }
}