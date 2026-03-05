import { motion } from "framer-motion";
import { Sparkles, Trophy, Target, Zap, ChevronRight, Medal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

export default function StudentDashboard() {
  return (
    <div className="space-y-8">
      {/* Header Profile Section */}
      <div className="glass-card rounded-[2.5rem] p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-dopamine rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/4" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-dopamine rounded-full animate-spin-slow opacity-70 group-hover:opacity-100 transition-opacity blur-md" />
            <Avatar className="w-32 h-32 border-4 border-white shadow-xl relative z-10">
              <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026024d" />
              <AvatarFallback>JU</AvatarFallback>
            </Avatar>
          </div>
          
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-4xl font-heading font-black">Joyful User</h1>
              <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                Level 42
              </div>
            </div>
            <p className="text-xl text-muted-foreground font-medium mb-4">"Spreading positive vibes since Day 1! 🌻"</p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="bg-white/50 dark:bg-black/50 backdrop-blur px-4 py-2 rounded-2xl flex items-center gap-2 border">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span className="font-bold text-lg">2,450 HP</span>
                <span className="text-xs text-muted-foreground uppercase">(Happiness Pts)</span>
              </div>
              <div className="bg-white/50 dark:bg-black/50 backdrop-blur px-4 py-2 rounded-2xl flex items-center gap-2 border">
                <Trophy className="w-5 h-5 text-blue-500" />
                <span className="font-bold text-lg">Top 5%</span>
                <span className="text-xs text-muted-foreground uppercase">Campus Rank</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Stats & Badges */}
        <div className="lg:col-span-2 space-y-8">
          {/* Level Progress */}
          <div className="glass-card rounded-[2rem] p-6 md:p-8">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="text-2xl font-bold font-heading flex items-center gap-2">
                  <Target className="w-6 h-6 text-primary" /> Journey to Level 43
                </h3>
                <p className="text-muted-foreground">You're so close! Complete 2 more quests.</p>
              </div>
              <span className="font-bold text-xl text-primary">85%</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-dopamine w-full rounded-full"
                initial={{ x: "-100%" }}
                animate={{ x: "-15%" }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Skill Badges Gallery */}
          <div className="glass-card rounded-[2rem] p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold font-heading flex items-center gap-2">
                <Medal className="w-6 h-6 text-accent" /> Skill Badges
              </h3>
              <button className="text-primary font-bold hover:underline flex items-center text-sm">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "Zen Master", icon: "🧘‍♀️", color: "from-emerald-400 to-teal-500" },
                { name: "Code Wizard", icon: "💻", color: "from-blue-400 to-indigo-500" },
                { name: "Vibe Setter", icon: "🎸", color: "from-purple-400 to-pink-500" },
                { name: "Social Butterfly", icon: "🦋", color: "from-amber-400 to-orange-500" }
              ].map((badge, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5, scale: 1.05 }}
                  className={`aspect-square rounded-3xl bg-gradient-to-br ${badge.color} p-1 shadow-lg cursor-pointer`}
                >
                  <div className="w-full h-full bg-white/20 backdrop-blur-md rounded-[1.4rem] flex flex-col items-center justify-center p-2 text-center text-white">
                    <span className="text-4xl mb-2 drop-shadow-md">{badge.icon}</span>
                    <span className="font-bold text-sm leading-tight text-shadow-sm">{badge.name}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Upcoming & Feed */}
        <div className="space-y-8">
          
          <div className="glass-card rounded-[2rem] p-6">
            <h3 className="text-xl font-bold font-heading mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-secondary" /> Upcoming Quests
            </h3>
            
            <div className="space-y-4">
              {[
                { title: "Sunset Yoga", time: "Today, 6 PM", type: "Meditation" },
                { title: "Hackathon Prep", time: "Tomorrow, 2 PM", type: "Coding" }
              ].map((event, i) => (
                <div key={i} className="bg-white/50 dark:bg-black/20 border p-4 rounded-2xl hover:border-primary transition-colors cursor-pointer group">
                  <div className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">{event.type}</div>
                  <h4 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{event.title}</h4>
                  <p className="text-sm text-muted-foreground font-medium">{event.time}</p>
                </div>
              ))}
              
              <button className="w-full py-4 rounded-2xl border-2 border-dashed border-border text-muted-foreground font-bold hover:border-primary hover:text-primary transition-colors">
                + Find more quests
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}