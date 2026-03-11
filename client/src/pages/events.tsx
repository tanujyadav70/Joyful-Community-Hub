import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Clock, Users, Sparkles, Filter, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import confetti from "canvas-confetti";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

const CATEGORIES = ["All", "Meditation", "Jam Session", "Coding", "Wellness"];

export default function EventsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [appliedEvents, setAppliedEvents] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: events } = useQuery<EventQuest[]>({
    queryKey: ["/api/events"],
  });

  // Fetch user's applied events
  const { data: userApplications } = useQuery<string[]>({
    queryKey: ["/api/events/user/applications"],
  });

  // Initialize appliedEvents state when userApplications data is loaded
  useEffect(() => {
    if (userApplications) {
      setAppliedEvents(userApplications);
    }
  }, [userApplications]);

  const applyMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/events/${id}/apply`);
      return (await res.json()) as EventQuest;
    },
    onSuccess: (updated, id) => {
      // Update the events list
      queryClient.setQueryData<EventQuest[]>(["/api/events"], (old) =>
        old ? old.map((e) => (e.id === updated.id ? updated : e)) : [updated],
      );

      // Update applied events list
      queryClient.setQueryData<string[]>(["/api/events/user/applications"], (old) =>
        old ? [...old, id] : [id],
      );

      // Invalidate profile and dashboard queries to refresh Joy Score
      queryClient.invalidateQueries({ queryKey: ["/api/profile/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });

      toast({
        title: "Quest joined! 🎉",
        description: `You earned ${updated.points} Joy Points!`,
      });

      // Trigger celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    },
    onError: (error: any) => {
      toast({
        title: "Could not apply",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredEvents =
    activeCategory === "All"
      ? events || []
      : (events || []).filter((e) => e.category === activeCategory);

  // Sort quests: active first (newest first), then completed (newest first)
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    // Determine completion status for each event
    const now = new Date();
    let aDateTime = new Date(a.date);
    if (a.time) {
      const [h, m] = a.time.split(":");
      if (!isNaN(Number(h)) && !isNaN(Number(m))) {
        aDateTime.setHours(Number(h), Number(m));
      }
    }
    const aCompleted = aDateTime <= now;

    let bDateTime = new Date(b.date);
    if (b.time) {
      const [h, m] = b.time.split(":");
      if (!isNaN(Number(h)) && !isNaN(Number(m))) {
        bDateTime.setHours(Number(h), Number(m));
      }
    }
    const bCompleted = bDateTime <= now;

    // Active quests before completed
    if (!aCompleted && bCompleted) return -1;
    if (aCompleted && !bCompleted) return 1;

    // Within the same group (active or completed), sort by creation time descending (newest first)
    // Since we don't have createdAt in the frontend, we'll assume the order from backend is already by createdAt desc
    // But to be safe, we can sort by id or something, but for now, keep the backend order
    return 0; // Maintain backend order within groups
  });

  const handleApply = (id: string) => {
    if (appliedEvents.includes(id)) return;

    setAppliedEvents((prev) => [...prev, id]);
    applyMutation.mutate(id);

    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        }),
      );
      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        }),
      );
    }, 250);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-black text-foreground mb-2 flex items-center gap-3">
            Happiness Quests <Sparkles className="w-8 h-8 text-primary" />
          </h1>
          <p className="text-xl text-muted-foreground">Find your next adventure and earn Joy Points.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
        <div className="flex items-center gap-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md p-2 rounded-2xl border">
          <Filter className="w-5 h-5 text-muted-foreground ml-2" />
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeCategory === cat 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredEvents.map((event, i) => {
            const eventId = (event as any).id || (event as any)._id || "";
            // ensure we treat id uniformly
            const applied = appliedEvents.includes(eventId);
            // determine if the quest date/time has already passed
            const now = new Date();
            // build a JS Date from the stored date/time strings; our backend may store
            // `date` as an ISO string (which already contains a time component) so we
            // parse it and then override the hours/minutes with `event.time` if
            // provided. This avoids invalid strings like "2025-01-01T00:00:00.000ZT13:00".
            let eventDateTime = new Date(event.date);
            if (event.time) {
              const [h, m] = event.time.split(":");
              if (!isNaN(Number(h)) && !isNaN(Number(m))) {
                eventDateTime.setHours(Number(h), Number(m));
              }
            }
            const isCompleted = eventDateTime <= now;
            return (
          <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              key={eventId}
              className={`glass-card rounded-[2rem] overflow-hidden flex flex-col group h-full ${
                isCompleted ? "opacity-50" : ""
              }`}
            >
              {/* show a badge for completed quests */}
              {isCompleted && (
                <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full font-bold text-sm shadow-lg z-10">
                  Completed
                </div>
              )}
              {/* Image Header */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={event.image} 
                  alt={event.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent`} />
                
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-foreground px-3 py-1 rounded-full font-bold text-sm shadow-lg">
                  +{event.points} pts
                </div>
                
                <div className="absolute bottom-4 left-4 right-4">
                  <Badge variant="secondary" className="mb-2 bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">
                    {event.category}
                  </Badge>
                  <h3 className="text-2xl font-bold text-white leading-tight">{event.title}</h3>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-muted-foreground font-medium">
                    <Calendar className="w-5 h-5 text-primary" />
                      {new Date(event.date).toLocaleDateString()} • {event.time}
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground font-medium">
                    <MapPin className="w-5 h-5 text-secondary" />
                    {event.location}
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground font-medium">
                    <Users className="w-5 h-5 text-accent" />
                    {event.attendees} joining
                  </div>
                </div>

                {/* Action */}
                <div className="mt-auto pt-4 border-t">
                  <Button
                    onClick={() => handleApply(eventId)}
                    variant={
                      isCompleted
                        ? "secondary"
                        : applied
                        ? "secondary"
                        : "default"
                    }
                    disabled={isCompleted}
                    className={`w-full h-14 rounded-2xl text-lg font-bold transition-all duration-300 ${
                      isCompleted
                        ? "opacity-50 cursor-not-allowed"
                        : applied
                        ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                        : "shadow-dopamine hover:shadow-dopamine-hover"
                    }`}
                  >
                    {isCompleted ? (
                      "Quest Completed"
                    ) : applied ? (
                      <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-6 h-6" /> Accepted Quest!
                      </motion.span>
                    ) : (
                      "Apply for Quest"
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
        </AnimatePresence>
      </div>
    </div>
  );
}