import type React from "react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Search, TrendingUp, Activity, UserCheck, Upload, X, Calendar, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AdminMetric = {
  title: string;
  value: string;
  trend: string;
  color: string;
  bg: string;
  icon: string;
};

type AdminStudent = {
  name: string;
  role: string;
  skills: string[];
  points: number;
};

type ActivityLog = {
  time: string;
  text: string;
};

type AdminDashboardData = {
  metrics: AdminMetric[];
  students: AdminStudent[];
  talentScoutUsers?: Array<AdminStudent & { joyScore: number; technicalSkills: string[]; generalSkills: string[] }>;
  activity: ActivityLog[];
};

type EventQuest = {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  points: number;
  gradient: string;
  image: string;
};

const metricIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Activity,
  TrendingUp,
  Users,
  UserCheck,
};

export default function AdminDashboard() {
  console.warn("=== AdminDashboard component loading ===");
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newQuestTitle, setNewQuestTitle] = useState("");
  const [newQuestCategory, setNewQuestCategory] = useState("Wellness");
  const [newQuestPoints, setNewQuestPoints] = useState("50");
  const [newQuestTime, setNewQuestTime] = useState("");
  const [newQuestLocation, setNewQuestLocation] = useState("");
  const [newQuestDate, setNewQuestDate] = useState("");
  const [newQuestImage, setNewQuestImage] = useState<File | null>(null);
  const [newQuestImagePreview, setNewQuestImagePreview] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  console.warn("AdminDashboard states initialized");

  const { data } = useQuery<AdminDashboardData>({
      queryKey: [`/api/admin/dashboard?q=${encodeURIComponent(searchQuery)}`],
      queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: createdQuests } = useQuery<EventQuest[]>({
    queryKey: ["/api/events"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // refetch dashboard when search changes
  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: [`/api/admin/dashboard?q=${encodeURIComponent(searchQuery)}`],
    });
  }, [searchQuery, queryClient]);



  const createEventMutation = useMutation({
    mutationFn: async () => {
      const points = Number(newQuestPoints) || 0;
      
      if (newQuestImage) {
        const formData = new FormData();
        formData.append("title", newQuestTitle);
        formData.append("category", newQuestCategory);
        formData.append("points", points.toString());
        formData.append("date", newQuestDate);
        formData.append("time", newQuestTime);
        formData.append("location", newQuestLocation);
        formData.append("image", newQuestImage);
        
        const res = await fetch("/api/events", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to create event");
        return res.json();
      }
      
      const res = await apiRequest("POST", "/api/events", {
        title: newQuestTitle,
        category: newQuestCategory,
        points,
        date: newQuestDate,
        time: newQuestTime,
        location: newQuestLocation,
      });
      return res.json();
    },
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setNewQuestTitle("");
      setNewQuestPoints("50");
      setNewQuestCategory("Wellness");
      setNewQuestTime("");
      setNewQuestDate("");
      setNewQuestLocation("");
      setNewQuestImage(null);
      setNewQuestImagePreview("");
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });

      // Invalidate Joy Score queries since creating events gives +30 points
      queryClient.invalidateQueries({ queryKey: ["/api/profile/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });

      toast({
        title: "Quest created",
        description: "Your new event quest is now available.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Could not create quest",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateQuest = () => {
    if (
      !newQuestTitle.trim() ||
        !newQuestDate.trim() ||
      !newQuestTime.trim() ||
      !newQuestLocation.trim()
    ) {
      toast({
        title: "Missing title",
        description: "Please provide title, time, and location.",
        variant: "destructive",
      });
      return;
    }
    createEventMutation.mutate();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG, PNG, or GIF image.",
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

    setNewQuestImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setNewQuestImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const deleteQuestMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/events/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<EventQuest[]>(
        ["/api/events"],
        (old) => (old ? old.filter((e) => e.id !== id) : []),
      );
      toast({
        title: "Quest deleted",
        description: "The quest has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Could not delete quest",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-heading font-black">Faculty Command Center</h1>
          <p className="text-xl text-muted-foreground mt-2">Manage campus vibes and student engagement.</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="h-14 rounded-2xl px-6 text-lg shadow-dopamine hover:shadow-dopamine-hover">
              <Plus className="w-5 h-5 mr-2" />
              Create Event Quest
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-8 glass-card">
            <DialogHeader>
              <DialogTitle className="text-3xl font-heading font-bold mb-4">Create New Quest</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-muted-foreground mb-1 block">Quest Title</label>
                <Input
                  className="h-12 rounded-xl"
                  placeholder="e.g. Midnight Pancake Study Session"
                  value={newQuestTitle}
                  onChange={(e) => setNewQuestTitle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-muted-foreground mb-1 block">Category</label>
                  <select
                    className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={newQuestCategory}
                    onChange={(e) => setNewQuestCategory(e.target.value)}
                  >
                    <option value="Wellness">Wellness</option>
                    <option value="Academic">Academic</option>
                    <option value="Social">Social</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-muted-foreground mb-1 block">Joy Points</label>
                  <Input
                    type="number"
                    className="h-12 rounded-xl"
                    placeholder="50"
                    value={newQuestPoints}
                    onChange={(e) => setNewQuestPoints(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-muted-foreground mb-1 block">Date</label>
                  <Input
                    type="date"
                    className="h-12 rounded-xl"
                    value={newQuestDate}
                    onChange={(e) => setNewQuestDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-muted-foreground mb-1 block">Time</label>
                  <Input
                    type="time"
                    className="h-12 rounded-xl"
                    value={newQuestTime}
                    onChange={(e) => setNewQuestTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-muted-foreground mb-1 block">Location</label>
                  <Input
                    className="h-12 rounded-xl"
                    placeholder="e.g. North Lawn"
                    value={newQuestLocation}
                    onChange={(e) => setNewQuestLocation(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Image Upload */}
              <div>
                <label className="text-sm font-bold text-muted-foreground mb-2 block">Quest Image</label>
                {newQuestImagePreview ? (
                  <div className="relative rounded-xl overflow-hidden h-40 mb-2 border-2 border-primary">
                    <img 
                      src={newQuestImagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setNewQuestImage(null);
                        setNewQuestImagePreview("");
                      }}
                      className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-input rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-bold text-muted-foreground">Upload Quest Image</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG or GIF (max 5MB)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <Button
                className="w-full h-14 rounded-xl text-lg font-bold mt-4"
                onClick={handleCreateQuest}
                disabled={createEventMutation.isPending}
              >
                Publish Quest ✨
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Created Quests Management */}
      <div className="glass-card rounded-[2rem] p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-heading font-bold">Created Quests</h2>
            <p className="text-muted-foreground">
              Manage the happiness quests you've created for your students.
            </p>
          </div>
        </div>

        {createdQuests === null ? (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900">
            <p className="font-semibold">Not Authenticated</p>
            <p className="text-sm mt-1">Please log in to view created quests.</p>
          </div>
        ) : (createdQuests || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No quests created yet. Use the Create Quest dialog to get started.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(createdQuests || []).map((quest) => (
              <div
                key={quest.id}
                className="glass-card rounded-[2rem] overflow-hidden flex flex-col group h-full"
              >
                {/* Image Header */}
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src={quest.image || "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop"} 
                    alt={quest.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop";
                    }}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent`} />
                  
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-sm font-bold text-white mb-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full w-fit">
                      +{quest.points} pts
                    </div>
                    <h3 className="text-xl font-bold text-white leading-tight">{quest.title}</h3>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 text-primary" />
                      {quest.date} • {quest.time}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 text-secondary" />
                      {quest.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4 text-accent" />
                      {quest.attendees} joining
                    </div>
                  </div>

                  {/* Action */}
                  <div className="mt-auto pt-4 border-t">
                    <Button 
                      onClick={() => deleteQuestMutation.mutate(quest.id)}
                      variant="destructive"
                      className="w-full h-11 rounded-xl text-sm font-bold"
                      disabled={deleteQuestMutation.isPending}
                    >
                      Delete Quest
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(data?.metrics || []).map((stat, i) => {
          const Icon =
            metricIconMap[stat.icon as keyof typeof metricIconMap] || Activity;
          return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-3xl p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">
                {stat.trend}
              </span>
            </div>
            <h3 className="text-muted-foreground font-medium mb-1">{stat.title}</h3>
            <p className="text-4xl font-black font-heading">{stat.value}</p>
          </motion.div>
        ); })}
      </div>

      <div className="glass-card rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h3 className="text-2xl font-bold font-heading">Talent Scout</h3>
            <p className="text-muted-foreground">Find students by skills for projects or clubs.</p>
          </div>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search 'React' or 'Guitar'..." 
              className="pl-10 h-12 rounded-xl w-full md:w-64 bg-white/50 dark:bg-black/50 border-2 focus-visible:ring-0 focus-visible:border-primary transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {/* Glowing hover effect simulated via focus border on Input */}
          </div>

        </div>

        <div className="space-y-4">
          {(data?.talentScoutUsers || []).map((student: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/40 dark:bg-black/20 border hover:border-primary/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-dopamine flex items-center justify-center text-white font-bold text-lg">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{student.name}</h4>
                  <p className="text-sm text-muted-foreground">{student.role}</p>
                </div>
              </div>
              <div className="hidden md:flex flex-wrap gap-2">
                {student.technicalSkills.map((skill: string) => (
                  <span key={skill} className="px-3 py-1 bg-secondary/10 text-secondary-foreground rounded-full text-xs font-bold">
                    {skill}
                  </span>
                ))}
                {student.generalSkills.map((skill: string) => (
                  <span key={skill} className="px-3 py-1 bg-accent/10 text-accent-foreground rounded-full text-xs font-bold">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full text-sm">
                {student.points} HP
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}