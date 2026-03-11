import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  SmilePlus,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Image as ImageIcon,
  Music as MusicIcon,
  Video,
  X,
  ChevronDown,
  ChevronUp,
  UserPlus,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type FeedPost = {
  id: string;
  author: {
    name: string;
    avatar: string;
    role: string;
    userId: string;
  };
  type: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  likes: number;
  comments: number;
  time: string;
  gradient: string;
  userLiked: boolean;
};

type CurrentUser = {
  id: string;
  username: string;
  name: string;
};

type Comment = {
  id: string;
  postId: string;
  author: {
    name: string;
  };
  text: string;
  time: string;
};

export default function HomeFeed() {
  const [postContent, setPostContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [commentsData, setCommentsData] = useState<Record<string, Comment[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: posts, isError, error } = useQuery<FeedPost[]>({
    queryKey: ["/api/feed"],
    // explicitly use the common queryFn so we know the request is happening
    queryFn: getQueryFn<{ id: string }[]>({ on401: "throw" }),
    // we always want to hit the backend on mount so that cached data cannot
    // hide new posts or cause the feed to appear empty after a reload
    refetchOnMount: "always",
    staleTime: 0,
  });

  // if fetching posts fails we show a toast for visibility
  if (isError) {
    console.error("Error loading feed:", error);
    toast({
      title: "Unable to load feed",
      description: "There was a problem fetching community posts. Please try again.",
      variant: "destructive",
    });
  }

  const { data: currentUser } = useQuery<CurrentUser>({
    queryKey: ["/api/auth/me"],
  });

  const sendConnectionRequestMutation = useMutation({
    mutationFn: async (receiverId: string) => {
      const res = await apiRequest("POST", "/api/connect/request", { receiverId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      toast({
        title: "Connection request sent!",
        description: "They'll be notified of your request.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Could not send request",
        description: error?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/feed', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create post');
      }
      return (await res.json()) as FeedPost;
    },
    onSuccess: (newPost) => {
      // update local cache quickly
      queryClient.setQueryData<FeedPost[]>(["/api/feed"], (old) =>
        old ? [newPost, ...old] : [newPost],
      );
      // also re-fetch from server to make sure backend is the source of truth
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });

      // Invalidate Joy Score queries since posting gives +5 points
      queryClient.invalidateQueries({ queryKey: ["/api/profile/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });

      setPostContent("");
      setSelectedFile(null);
      toast({
        title: "Shared!",
        description: "Your joyful moment is now live in the feed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Could not share",
        description: error?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await apiRequest("POST", `/api/posts/${postId}/like`);
      return res.json();
    },
    onSuccess: (result, postId) => {
      queryClient.setQueryData<FeedPost[]>(["/api/feed"], (old) =>
        old?.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: result.liked ? post.likes + 1 : post.likes - 1,
                userLiked: result.liked,
              }
            : post
        )
      );

      // Invalidate Joy Score queries since liking gives +2 points to post owner
      queryClient.invalidateQueries({ queryKey: ["/api/profile/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({ postId, text }: { postId: string; text: string }) => {
      const res = await apiRequest("POST", `/api/posts/${postId}/comments`, { text });
      return res.json();
    },
    onSuccess: (newComment, { postId }) => {
      // Invalidate comments query to refetch
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
      // Update comment count
      queryClient.setQueryData<FeedPost[]>(["/api/feed"], (old) =>
        old?.map((post) =>
          post.id === postId
            ? { ...post, comments: post.comments + 1 }
            : post
        )
      );
      setNewComments((prev) => ({ ...prev, [postId]: "" }));
    },
  });

  const isPosting = createPostMutation.isPending;

  const handleFileSelect = (type: 'image' | 'video' | 'audio') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : 'audio/*';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSharePost = () => {
    const content = postContent.trim();
    if (!content && !selectedFile) return;

    const formData = new FormData();
    formData.append('text', content);
    if (selectedFile) {
      formData.append('media', selectedFile);
    }

    createPostMutation.mutate(formData);
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
        // Load comments when expanding
        loadComments(postId);
      }
      return next;
    });
  };

  const loadComments = async (postId: string) => {
    try {
      const res = await apiRequest("GET", `/api/posts/${postId}/comments`);
      const comments = await res.json();
      setCommentsData((prev) => ({ ...prev, [postId]: comments }));
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleCommentSubmit = (postId: string) => {
    const text = newComments[postId]?.trim();
    if (!text) return;

    createCommentMutation.mutate({ postId, text });
  };

  const handleConnect = (userId: string) => {
    sendConnectionRequestMutation.mutate(userId);
  };

  const handleShareLink = (post: FeedPost) => {
    const shareText = `${post.content}\n\nShared from HappinessHub.`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      navigator
        .share({
          title: "HappinessHub",
          text: shareText,
          url: shareUrl,
        })
        .catch(() => {
          // ignore cancellation
        });
    } else if (navigator.clipboard) {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          toast({
            title: "Link copied",
            description: "Feed link copied to your clipboard.",
          });
        })
        .catch(() => {
          toast({
            title: "Could not copy link",
            description: "Please copy it manually from the address bar.",
            variant: "destructive",
          });
        });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
      
      {/* Create Post Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-[2rem] p-6 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
        
        <div className="flex gap-4 mb-4">
          <Avatar className="w-12 h-12 border-2 border-primary">
            <AvatarFallback>JU</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Share a smile or positive moment..."
              className="w-full bg-transparent border-none focus:ring-0 resize-none text-lg placeholder:text-muted-foreground/60 min-h-[60px]"
            />
            {selectedFile && (
              <div className="mt-2 p-2 bg-muted/50 rounded-lg flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedFile.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeSelectedFile}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleFileSelect('image')}
              className="rounded-xl text-primary hover:bg-primary/10 hover:text-primary"
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleFileSelect('video')}
              className="rounded-xl text-secondary hover:bg-secondary/10 hover:text-secondary"
            >
              <Video className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleFileSelect('audio')}
              className="rounded-xl text-accent hover:bg-accent/10 hover:text-accent"
            >
              <MusicIcon className="w-5 h-5" />
            </Button>
          </div>
          <Button 
            className="rounded-full px-6 font-bold shadow-md hover:shadow-lg transition-shadow"
            type="button"
            onClick={handleSharePost}
            disabled={(!postContent.trim() && !selectedFile) || isPosting}
          >
            <SmilePlus className="w-4 h-4 mr-2" />
            {isPosting ? "Sharing..." : "Share Joy"}
          </Button>
        </div>
      </motion.div>

      {/* Feed Divider */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Latest Vibes</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Feed Posts */}
      <div className="space-y-6">
        {(posts || []).map((post, i) => {
          const isExpanded = expandedComments.has(post.id);
          const comments = commentsData[post.id] || [];

          return (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-[2.5rem] overflow-hidden group hover:-translate-y-1 transition-transform duration-300"
          >
            {/* Header */}
            <div className={`p-6 bg-gradient-to-br ${post.gradient}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                    <AvatarFallback>{post.author.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-foreground">{post.author.name}</h3>
                    <p className="text-xs text-muted-foreground">{post.author.role} • {post.time}</p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/40 backdrop-blur-md text-xs font-bold text-foreground/80 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                  {post.type}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 pt-4 space-y-4">
              <p className="text-lg leading-relaxed text-foreground/90">
                {post.content}
              </p>
              
              {post.mediaUrl && post.mediaType === 'image' && (
                <div className="relative h-64 sm:h-80 rounded-3xl overflow-hidden shadow-inner">
                  <img src={post.mediaUrl} alt="Post content" className="w-full h-full object-cover" />
                </div>
              )}
              
              {post.mediaUrl && post.mediaType === 'video' && (
                <div className="relative rounded-3xl overflow-hidden shadow-inner">
                  <video controls className="w-full max-h-96 rounded-3xl">
                    <source src={post.mediaUrl} type="video/mp4" />
                    <source src={post.mediaUrl} type="video/webm" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
              
              {post.mediaUrl && post.mediaType === 'audio' && (
                <div className="p-4 bg-muted/30 rounded-3xl">
                  <audio controls className="w-full">
                    <source src={post.mediaUrl} type="audio/mp3" />
                    <source src={post.mediaUrl} type="audio/wav" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-6 pt-4">
                <button
                  type="button"
                  onClick={() => likeMutation.mutate(post.id)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors group/btn"
                  disabled={likeMutation.isPending}
                >
                  <div className="p-2 rounded-full group-hover/btn:bg-accent/10 transition-colors">
                    <Heart
                      className={`w-6 h-6 ${
                        post.userLiked ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                  </div>
                  <span className="font-semibold">{post.likes}</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors group/btn"
                >
                  <div className="p-2 rounded-full group-hover/btn:bg-secondary/10 transition-colors">
                    {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                  </div>
                  <span className="font-semibold">{post.comments}</span>
                </button>
                {post.author.userId !== currentUser?.id && (
                  <button
                    type="button"
                    onClick={() => handleConnect(post.author.userId)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group/btn"
                    disabled={sendConnectionRequestMutation.isPending}
                  >
                    <div className="p-2 rounded-full group-hover/btn:bg-primary/10 transition-colors">
                      <UserPlus className="w-6 h-6" />
                    </div>
                    <span className="font-semibold">Connect</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleShareLink(post)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group/btn ml-auto"
                >
                  <div className="p-2 rounded-full group-hover/btn:bg-primary/10 transition-colors">
                    <Share2 className="w-6 h-6" />
                  </div>
                </button>
              </div>

              {/* Comments Section */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-border pt-4 space-y-4"
                >
                  {/* Add Comment */}
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">U</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={newComments[post.id] || ''}
                        onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                        placeholder="Write a comment..."
                        className="flex-1 px-3 py-2 bg-muted/50 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleCommentSubmit(post.id)}
                        disabled={!newComments[post.id]?.trim() || createCommentMutation.isPending}
                        className="rounded-full px-4"
                      >
                        Post
                      </Button>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-3">
                    {(comments || []).map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {comment.author.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-muted/30 rounded-2xl px-4 py-2">
                            <p className="font-semibold text-sm">{comment.author.name}</p>
                            <p className="text-sm">{comment.text}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{comment.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        ); })}
      </div>
    </div>
  );
}