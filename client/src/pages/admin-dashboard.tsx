import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Users, Plus, Search, TrendingUp, Activity, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminDashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-8">
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
                <Input className="h-12 rounded-xl" placeholder="e.g. Midnight Pancake Study Session" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-muted-foreground mb-1 block">Category</label>
                  <select className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                    <option>Wellness</option>
                    <option>Academic</option>
                    <option>Social</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-muted-foreground mb-1 block">Joy Points</label>
                  <Input type="number" className="h-12 rounded-xl" placeholder="50" />
                </div>
              </div>
              <Button className="w-full h-14 rounded-xl text-lg font-bold mt-4" onClick={() => setIsCreateModalOpen(false)}>
                Publish Quest ✨
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Campus Vibe Level", value: "87%", icon: Activity, color: "text-primary", bg: "bg-primary/10", trend: "+5% this week" },
          { title: "Total Joy Points", value: "1.2M", icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/10", trend: "+120k this week" },
          { title: "Active Students", value: "4,209", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", trend: "+34 today" },
          { title: "Quests Completed", value: "892", icon: UserCheck, color: "text-emerald-500", bg: "bg-emerald-500/10", trend: "High engagement" }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-3xl p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">
                {stat.trend}
              </span>
            </div>
            <h3 className="text-muted-foreground font-medium mb-1">{stat.title}</h3>
            <p className="text-4xl font-black font-heading">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Student Recruitment/Search */}
        <div className="lg:col-span-2 glass-card rounded-[2rem] p-6 md:p-8">
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
            {[
              { name: "Alex Johnson", role: "Computer Science", skills: ["React", "Python", "UI Design"], points: 3400 },
              { name: "Mia Wong", role: "Music Performance", skills: ["Guitar", "Vocals", "Audio Mixing"], points: 2850 },
              { name: "Sam Teller", role: "Business Admin", skills: ["Public Speaking", "Event Planning"], points: 4100 }
            ].map((student, i) => (
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
                <div className="hidden md:flex gap-2">
                  {student.skills.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-secondary/10 text-secondary-foreground rounded-full text-xs font-bold">
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

        {/* Recent Activity Logs */}
        <div className="glass-card rounded-[2rem] p-6">
          <h3 className="text-xl font-bold font-heading mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Live Vibe Feed
          </h3>
          <div className="space-y-6">
            {[
              { time: "2m ago", text: "New post in 'Music Clips' trending." },
              { time: "15m ago", text: "50 students RSVP'd to Sunset Yoga." },
              { time: "1h ago", text: "Alex J. reached Level 50!" },
              { time: "3h ago", text: "Code Club created a new quest." }
            ].map((log, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-2 h-2 mt-2 rounded-full bg-primary animate-pulse" />
                <div>
                  <p className="text-sm font-medium">{log.text}</p>
                  <span className="text-xs text-muted-foreground">{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}