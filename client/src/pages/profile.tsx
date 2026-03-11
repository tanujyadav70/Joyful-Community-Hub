import { useParams } from "wouter";
import { motion } from "framer-motion";
import { Heart, MessageSquare,MessageCircle, MapPin, Link as LinkIcon, Instagram, Twitter, UserPlus, UserCheck, Edit, Camera, Users, ThumbsUp, FileText, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { triggerCelebration } from "@/lib/confetti";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

type ProfileLoveNote = {
  name: string;
  text: string;
  avatar: string;
};

type ProfileData = {
  id: string;
  name: string;
  major: string;
  location: string;
  portfolio: string;
  happinessPoints: number;
  skillTags: string[];
  vibeBio: string;
  loveNotes: ProfileLoveNote[];
  profileImage?: string;
  technicalSkills: string[];
  generalSkills: string[];
};

type UserStats = {
  postsCount: number;
  connectionsCount: number;
  totalLikes: number;
  pendingRequestsReceived: number;
  sentRequestsPending: number;
};

type ConnectionRequest = {
  id: string;
  senderId: string;
  receiverId: string;
  requesterName: string;
  requesterAvatar: string;
  requesterUserId: string;
  status: string;
  createdAt: string;
  isIncoming: boolean;
};

type UserPost = {
  id: string;
  author: {
    name: string;
    avatar: string;
    role: string;
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

type Connection = {
  userId: string;
  name: string;
  avatar: string;
  profileImage?: string;
  connectedAt: string;
};

const technicalSkillOptions = [
  'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'MongoDB', 'Machine Learning', 'Data Science', 'UI/UX Design', 'Web Development', 'App Development', 'DevOps', 'Cybersecurity'
];

const generalSkillOptions = [
  'Public Speaking', 'Leadership', 'Event Management', 'Content Writing', 'Video Editing', 'Graphic Design', 'Photography', 'Social Media Management', 'Community Building', 'Marketing', 'Teaching', 'Research'
];

export default function ProfilePage() {
  const { id } = useParams();
  const profileId = id || "me";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    vibeBio: "",
    major: "",
    location: "",
    portfolio: "",
    technicalSkills: [] as string[],
    generalSkills: [] as string[],
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isOwnProfile = profileId === "me";

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const { data: profile } = useQuery<ProfileData>({
    queryKey: ["/api/profile", profileId],
  });

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/profile/stats", profileId],
    enabled: isOwnProfile,
  });

  const { data: connectionRequests } = useQuery<ConnectionRequest[]>({
    queryKey: ["/api/connect/requests"],
    enabled: isOwnProfile,
  });

  const { data: userPosts } = useQuery<UserPost[]>({
    queryKey: ["/api/posts/user", profileId],
    enabled: isOwnProfile,
  });

  const { data: acceptedConnections } = useQuery<Connection[]>({
    queryKey: ["/api/connect/connections", "me"],
    enabled: isOwnProfile,
  });

  const addLoveMutation = useMutation({
    mutationFn: async (payload: { name: string; text: string }) => {
      const res = await apiRequest("POST", `/api/profile/${profileId}/love`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile", profileId] });
      toast({
        title: "Thank you!",
        description: "Your message was added to the Wall of Love.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Could not add love note",
        description: error?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: Partial<ProfileData>) => {
      const res = await apiRequest("PUT", "/api/profile/update", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile", profileId] });
      setIsEditOpen(false);
      toast({
        title: "Profile updated!",
        description: "Your vibe bio has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Could not update profile",
        description: error?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch('/api/profile/upload-avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to upload avatar');
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Update the profile data in the cache immediately
      queryClient.setQueryData(["/api/profile", profileId], (oldData: ProfileData | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          profileImage: data.profileImage
        };
      });

      // Invalidate and refetch to ensure the UI updates
      queryClient.invalidateQueries({ queryKey: ["/api/profile", profileId] });

      setSelectedFile(null);
      toast({
        title: "Avatar updated!",
        description: "Your profile picture has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Could not upload avatar",
        description: error?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/connect/request", { receiverId: profileId });
      return res.json();
    },
    onSuccess: () => {
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

  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await apiRequest("POST", `/api/connect/accept/${requestId}`);
      return res.json();
    },
    onSuccess: (data, requestId) => {
      // Find the requester's name from the connection requests
      const request = connectionRequests?.find(r => r.id === requestId);
      const requesterName = request?.requesterName || "User";
      
      triggerCelebration();
      queryClient.invalidateQueries({ queryKey: ["/api/connect/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile/stats", "me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connect/connections", "me"] });
      toast({
        title: "Connection accepted! 🎉",
        description: `You are now connected with ${requesterName}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Could not accept request",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await apiRequest("POST", `/api/connect/reject/${requestId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connect/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile/stats", "me"] });
      toast({
        title: "Request declined",
        description: "The connection request has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Could not decline request",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLeaveLove = () => {
    const text = window.prompt("Leave some love for this profile:");
    if (!text || !text.trim()) return;

    addLoveMutation.mutate({
      name: "Anonymous",
      text: text.trim(),
    });
  };

  const handleEditProfile = () => {
    if (profile) {
      setEditForm({
        name: profile.name,
        vibeBio: profile.vibeBio,
        major: profile.major,
        location: profile.location,
        portfolio: profile.portfolio,
        technicalSkills: profile.technicalSkills || [],
        generalSkills: profile.generalSkills || [],
      });
    }
    setIsEditOpen(true);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editForm);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a JPG, PNG, or WebP image.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      uploadAvatarMutation.mutate(file);
    }
  };

  if (isOwnProfile) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Profile Header */}
        <div className="relative rounded-[3rem] overflow-hidden bg-white/40 dark:bg-black/40 backdrop-blur-3xl border border-white/20 shadow-xl pb-8">
          <div className="h-48 w-full bg-gradient-to-r from-amber-400 via-rose-400 to-fuchsia-500 relative overflow-hidden">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
            <div className="absolute bottom-10 right-20 w-48 h-48 bg-black/10 rounded-full blur-3xl" />
          </div>

          <div className="px-8 flex flex-col md:flex-row gap-6 relative">
            <div className="-mt-16 flex-shrink-0 relative">
              <Avatar key={profile?.profileImage} className="w-32 h-32 border-8 border-background/80 shadow-2xl bg-white">
                <AvatarImage
                  src={
                    profile?.profileImage
                      ? `${window.location.origin}${profile.profileImage}`
                      : undefined
                  }
                />
                <AvatarFallback className="text-2xl">
                  {profile?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'JU'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center">
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-2 right-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center cursor-pointer shadow-lg transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploadAvatarMutation.isPending}
                />
              </div>
            </div>

            <div className="pt-4 flex-1">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-heading font-black text-foreground">
                    {profile?.name || (currentUser as any)?.name || 'Your Name'}
                  </h1>
                  <p className="text-lg text-primary font-bold">
                    {profile?.major || 'Your Major'}
                  </p>

                  <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {profile?.location || 'Your Location'}
                    </span>
                    <span className="flex items-center gap-1">
                      <LinkIcon className="w-4 h-4" /> {profile?.portfolio || 'portfolio.com'}
                    </span>
                  </div>
                  {/* Display selected skills */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(profile?.technicalSkills || []).map(skill => (
                      <span key={skill} className="px-3 py-1 bg-secondary/10 text-secondary-foreground rounded-full text-xs font-bold">
                        {skill}
                      </span>
                    ))}
                    {(profile?.generalSkills || []).map(skill => (
                      <span key={skill} className="px-3 py-1 bg-accent/10 text-accent-foreground rounded-full text-xs font-bold">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <Button
                  className="rounded-full px-6 shadow-md hover:shadow-lg"
                  onClick={handleEditProfile}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>

          {/* Vibe Bio */}
          <div className="px-8 mt-6">
            <h3 className="text-xl font-bold font-heading mb-3">Vibe Bio ✨</h3>
            <p className="text-lg text-foreground/80 leading-relaxed bg-white/30 dark:bg-black/20 p-6 rounded-3xl">
              {profile?.vibeBio || 'Tell us about your vibe! What makes you unique?'}
            </p>
          </div>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass-card rounded-2xl p-6 text-center">
            <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{userStats?.postsCount || 0}</div>
            <p className="text-sm text-muted-foreground">Posts Shared</p>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center">
            <Users className="w-8 h-8 text-secondary mx-auto mb-2" />
            <div className="text-2xl font-bold">{userStats?.connectionsCount || 0}</div>
            <p className="text-sm text-muted-foreground">Connections</p>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center">
            <ThumbsUp className="w-8 h-8 text-accent mx-auto mb-2" />
            <div className="text-2xl font-bold">{userStats?.totalLikes || 0}</div>
            <p className="text-sm text-muted-foreground">Likes Received</p>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center">
            <UserPlus className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{userStats?.pendingRequestsReceived || 0}</div>
            <p className="text-sm text-muted-foreground">Pending Requests</p>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center">
            <UserCheck className="w-8 h-8 text-secondary mx-auto mb-2" />
            <div className="text-2xl font-bold">{userStats?.sentRequestsPending || 0}</div>
            <p className="text-sm text-muted-foreground">Sent Pending</p>
          </div>
        </div>

        {/* Connection Requests */}
        {isOwnProfile && connectionRequests && connectionRequests.filter((req: any) => req.isIncoming && req.status === 'pending').length > 0 && (
          <div className="glass-card rounded-[3rem] p-8">
            <h2 className="text-2xl font-heading font-bold mb-6">Connection Requests</h2>
            <div className="space-y-4">
              {connectionRequests
                .filter((req: any) => req.isIncoming && req.status === 'pending')
                .map((request: ConnectionRequest) => (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{request.requesterAvatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{request.requesterName}</p>
                        <p className="text-sm text-muted-foreground">wants to connect</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => acceptRequestMutation.mutate(request.id)}
                        disabled={acceptRequestMutation.isPending}
                        className="rounded-full"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectRequestMutation.mutate(request.id)}
                        disabled={rejectRequestMutation.isPending}
                        className="rounded-full"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* My Connections */}
        {isOwnProfile && acceptedConnections && acceptedConnections.length > 0 && (
          <div className="glass-card rounded-[3rem] p-8">
            <h2 className="text-2xl font-heading font-bold mb-6">My Connections ✨</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2">
              {acceptedConnections.map((connection: Connection) => (
                <motion.div
                  key={connection.userId}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card rounded-2xl p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="w-12 h-12 group-hover:ring-2 ring-primary transition-all">
                      {connection.profileImage ? (
                        <AvatarImage src={connection.profileImage} alt={connection.name} />
                      ) : null}
                      <AvatarFallback>{connection.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate group-hover:text-primary transition-colors">{connection.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Connected {new Date(connection.connectedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full rounded-full text-xs"
                    asChild
                  >
                    <a href={`/profile/${connection.userId}`}>View Profile</a>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Latest Vibes */}
        <div className="glass-card rounded-[3rem] p-8">
          <h2 className="text-2xl font-heading font-bold mb-6">Your Latest Vibes</h2>

          <div className="space-y-6">
            {(userPosts || []).map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-6"
              >
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback>{post.author.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold">{post.author.name}</span>
                      <span className="text-sm text-muted-foreground">• {post.time}</span>
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                        {post.type}
                      </span>
                    </div>

                    <p className="text-foreground mb-4">{post.content}</p>

                    {post.mediaUrl && post.mediaType === 'image' && (
                      <img src={post.mediaUrl} alt="Post media" className="rounded-xl max-w-md max-h-64 object-cover" />
                    )}

                    {post.mediaUrl && post.mediaType === 'video' && (
                      <video controls className="rounded-xl max-w-md">
                        <source src={post.mediaUrl} type="video/mp4" />
                      </video>
                    )}

                    {post.mediaUrl && post.mediaType === 'audio' && (
                      <audio controls className="w-full max-w-md">
                        <source src={post.mediaUrl} type="audio/mp3" />
                      </audio>
                    )}

                    <div className="flex items-center gap-4 mt-4 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className={`w-4 h-4 ${post.userLiked ? 'fill-red-500 text-red-500' : ''}`} />
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {post.comments}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {(!userPosts || userPosts.length === 0) && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No vibes shared yet!</p>
                <p className="text-sm">Start sharing your joy in the Community Feed.</p>
              </div>
            )}
          </div>
        </div>

        {/* Edit Profile Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Your Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label htmlFor="vibeBio">Vibe Bio</Label>
                <Textarea
                  id="vibeBio"
                  value={editForm.vibeBio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, vibeBio: e.target.value }))}
                  placeholder="Tell us about your vibe..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="major">Major/Role</Label>
                <Input
                  id="major"
                  value={editForm.major}
                  onChange={(e) => setEditForm(prev => ({ ...prev, major: e.target.value }))}
                  placeholder="Your major or role"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={editForm.location}
                  onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Your location"
                />
              </div>
              <div>
                <Label htmlFor="portfolio">Portfolio/Website</Label>
                <Input
                  id="portfolio"
                  value={editForm.portfolio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, portfolio: e.target.value }))}
                  placeholder="yourportfolio.com"
                />
              </div>
              {/* Skills & Talents */}
              <div>
                <h4 className="font-semibold mt-4 mb-2">Skills & Talents</h4>
                <div className="space-y-4">
                  <div>
                    <Label>Technical Skills</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          Select Technical Skills
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search technical skills..." />
                          <CommandList>
                            <CommandEmpty>No skills found.</CommandEmpty>
                            <CommandGroup>
                              {technicalSkillOptions.map(skill => (
                                <CommandItem key={skill}>
                                  <Checkbox
                                    checked={editForm.technicalSkills.includes(skill)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setEditForm(prev => ({ ...prev, technicalSkills: [...prev.technicalSkills, skill] }));
                                      } else {
                                        setEditForm(prev => ({ ...prev, technicalSkills: prev.technicalSkills.filter(s => s !== skill) }));
                                      }
                                    }}
                                  />
                                  <span className="ml-2">{skill}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editForm.technicalSkills.map(skill => (
                        <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <button
                            onClick={() => setEditForm(prev => ({ ...prev, technicalSkills: prev.technicalSkills.filter(s => s !== skill) }))}
                            className="text-xs hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>General Skills</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          Select General Skills
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search general skills..." />
                          <CommandList>
                            <CommandEmpty>No skills found.</CommandEmpty>
                            <CommandGroup>
                              {generalSkillOptions.map(skill => (
                                <CommandItem key={skill}>
                                  <Checkbox
                                    checked={editForm.generalSkills.includes(skill)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setEditForm(prev => ({ ...prev, generalSkills: [...prev.generalSkills, skill] }));
                                      } else {
                                        setEditForm(prev => ({ ...prev, generalSkills: prev.generalSkills.filter(s => s !== skill) }));
                                      }
                                    }}
                                  />
                                  <span className="ml-2">{skill}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editForm.generalSkills.map(skill => (
                        <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <button
                            onClick={() => setEditForm(prev => ({ ...prev, generalSkills: prev.generalSkills.filter(s => s !== skill) }))}
                            className="text-xs hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending} className="flex-1">
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Other user's profile view
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Cover Profile Header */}
      <div className="relative rounded-[3rem] overflow-hidden bg-white/40 dark:bg-black/40 backdrop-blur-3xl border border-white/20 shadow-xl pb-8">
        {/* Abstract Background Header */}
        <div className="h-64 w-full bg-gradient-to-r from-amber-400 via-rose-400 to-fuchsia-500 relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
          <div className="absolute bottom-10 right-20 w-48 h-48 bg-black/10 rounded-full blur-3xl" />
        </div>

        {/* Profile Info */}
        <div className="px-8 flex flex-col md:flex-row gap-6 relative">
          <div className="-mt-20 flex-shrink-0 relative">
             <Avatar key={profile?.profileImage} className="w-40 h-40 border-8 border-background/80 shadow-2xl bg-white">
              <AvatarImage
              src={
                profile?.profileImage
                  ? `${window.location.origin}${profile.profileImage}`
                  : undefined
              }
            />
              <AvatarFallback className="text-xl">
                {profile?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'JU'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 border-4 border-background rounded-full" />
          </div>

          <div className="pt-4 flex-1">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h1 className="text-4xl font-heading font-black text-foreground">
                  {profile?.name ?? 'Alex "Vibes" Chen'}
                </h1>
                <p className="text-xl text-primary font-bold">
                  {profile?.major ?? "Design Engineering Major"}
                </p>
                
                <div className="flex items-center gap-4 mt-3 text-muted-foreground font-medium">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {profile?.location ?? "North Campus"}
                  </span>
                  <span className="flex items-center gap-1">
                    <LinkIcon className="w-4 h-4" /> {profile?.portfolio ?? "portfolio.com"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  className="rounded-full px-6 shadow-md hover:shadow-lg bg-foreground text-background hover:bg-foreground/90"
                  onClick={() => connectMutation.mutate()}
                  disabled={connectMutation.isPending}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {connectMutation.isPending ? "Connecting..." : "Connect"}
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                  <MessageSquare className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Vibe Bio & Skills */}
        <div className="px-8 mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-xl font-bold font-heading mb-3">Vibe Bio ✨</h3>
              <p className="text-lg text-foreground/80 leading-relaxed bg-white/30 dark:bg-black/20 p-6 rounded-3xl">
                {profile?.vibeBio ??
                  `"Obsessed with creating interfaces that make people smile. When I'm not pushing pixels or writing React, you can find me playing indie games or hunting for the best campus coffee. Always down to collaborate on weird, fun projects!"`}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold font-heading mb-3">Skill Tags</h3>
              <div className="flex flex-wrap gap-2">
                {(profile?.skillTags ??
                  ["UI/UX Design", "React", "3D Animation", "Framer Motion", "Latte Art", "CSS Wizardry"]
                ).map((skill) => (
                  <span key={skill} className="px-4 py-2 bg-primary/10 text-primary-foreground font-bold rounded-xl border border-primary/20 hover:bg-primary hover:text-white transition-colors cursor-default">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="bg-white/50 dark:bg-black/30 rounded-3xl p-6 border text-center">
                <div className="text-5xl font-black font-heading text-amber-500 mb-2">
                  {(profile?.happinessPoints ?? 4280).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Happiness Points</p>
             </div>

             <div className="flex justify-center gap-4">
                <button className="p-3 bg-white/50 dark:bg-black/30 rounded-2xl hover:bg-pink-500/10 hover:text-pink-500 transition-colors">
                  <Instagram className="w-6 h-6" />
                </button>
                <button className="p-3 bg-white/50 dark:bg-black/30 rounded-2xl hover:bg-blue-500/10 hover:text-blue-500 transition-colors">
                  <Twitter className="w-6 h-6" />
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Wall of Love */}
      <div className="glass-card rounded-[3rem] p-8 md:p-10">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
          <h2 className="text-3xl font-heading font-bold">Wall of Love</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(profile?.loveNotes ??
            [
              { name: "Sarah J.", text: "Alex's design tips literally saved my final project! So helpful.", avatar: "SJ" },
              { name: "Prof. Davis", text: "Outstanding contribution to the campus app redesign. A joy to have in class.", avatar: "PD" },
              { name: "Mike T.", text: "Best coffee recommendations on campus ☕️🔥", avatar: "MT" },
            ]
          ).map((comment, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/60 dark:bg-zinc-800/60 p-6 rounded-3xl border hover:shadow-lg transition-all"
            >
              <p className="text-lg italic text-foreground/90 mb-4">"{comment.text}"</p>
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">{comment.avatar}</AvatarFallback>
                </Avatar>
                <span className="font-bold text-sm">{comment.name}</span>
              </div>
            </motion.div>
          ))}
          
          <button
            type="button"
            onClick={handleLeaveLove}
            className="bg-dashed border-2 border-dashed border-border p-6 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <p className="font-bold text-muted-foreground group-hover:text-primary">Leave some love</p>
          </button>
        </div>
      </div>
    </div>
  );
}