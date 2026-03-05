import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Clock, Users, Sparkles, Filter, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import confetti from "canvas-confetti";

const MOCK_EVENTS = [
  {
    id: 1,
    title: "Sunset Yoga on the Quad",
    category: "Meditation",
    date: "Today",
    time: "6:00 PM",
    location: "Main Campus Quad",
    attendees: 45,
    points: 50,
    gradient: "from-orange-400 to-rose-400",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2720&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "Acoustic Jam Session",
    category: "Jam Session",
    date: "Tomorrow",
    time: "8:00 PM",
    location: "Student Union Lounge",
    attendees: 12,
    points: 75,
    gradient: "from-blue-400 to-cyan-400",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2670&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "Code & Coffee: Build a Bot",
    category: "Coding",
    date: "Thursday",
    time: "10:00 AM",
    location: "Innovation Lab 304",
    attendees: 28,
    points: 100,
    gradient: "from-amber-400 to-yellow-500",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2670&auto=format&fit=crop"
  },
  {
    id: 4,
    title: "Therapy Dogs Visit",
    category: "Wellness",
    date: "Friday",
    time: "12:00 PM",
    location: "Library Lobby",
    attendees: 156,
    points: 25,
    gradient: "from-emerald-400 to-teal-400",
    image: "https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=2574&auto=format&fit=crop"
  }
];

const CATEGORIES = ["All", "Meditation", "Jam Session", "Coding", "Wellness"];

export default function EventsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [appliedEvents, setAppliedEvents] = useState<number[]>([]);

  const filteredEvents = activeCategory === "All" 
    ? MOCK_EVENTS 
    : MOCK_EVENTS.filter(e => e.category === activeCategory);

  const handleApply = (id: number) => {
    if (appliedEvents.includes(id)) return;
    
    setAppliedEvents(prev => [...prev, id]);
    
    // Confetti pop!
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
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
          {filteredEvents.map((event, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              key={event.id}
              className="glass-card rounded-[2rem] overflow-hidden flex flex-col group h-full"
            >
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
                    {event.date} • {event.time}
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
                    onClick={() => handleApply(event.id)}
                    variant={appliedEvents.includes(event.id) ? "secondary" : "default"}
                    className={`w-full h-14 rounded-2xl text-lg font-bold transition-all duration-300 ${
                      appliedEvents.includes(event.id) 
                        ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" 
                        : "shadow-dopamine hover:shadow-dopamine-hover"
                    }`}
                  >
                    {appliedEvents.includes(event.id) ? (
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
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}