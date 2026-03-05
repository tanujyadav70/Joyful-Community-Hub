import { useParams } from "wouter";
import { motion } from "framer-motion";
import { Heart, MessageSquare, MapPin, Link as LinkIcon, Instagram, Twitter } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { id } = useParams();

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
             <Avatar className="w-40 h-40 border-8 border-background/80 shadow-2xl bg-white">
              <AvatarImage src="https://i.pravatar.cc/150?u=a04258114e29026702d" />
              <AvatarFallback>JU</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 border-4 border-background rounded-full" />
          </div>

          <div className="pt-4 flex-1">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h1 className="text-4xl font-heading font-black text-foreground">Alex "Vibes" Chen</h1>
                <p className="text-xl text-primary font-bold">Design Engineering Major</p>
                
                <div className="flex items-center gap-4 mt-3 text-muted-foreground font-medium">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> North Campus</span>
                  <span className="flex items-center gap-1"><LinkIcon className="w-4 h-4" /> portfolio.com</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="rounded-full px-6 shadow-md hover:shadow-lg bg-foreground text-background hover:bg-foreground/90">
                  Connect
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
                "Obsessed with creating interfaces that make people smile. When I'm not pushing pixels or writing React, you can find me playing indie games or hunting for the best campus coffee. Always down to collaborate on weird, fun projects!"
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold font-heading mb-3">Skill Tags</h3>
              <div className="flex flex-wrap gap-2">
                {["UI/UX Design", "React", "3D Animation", "Framer Motion", "Latte Art", "CSS Wizardry"].map(skill => (
                  <span key={skill} className="px-4 py-2 bg-primary/10 text-primary-foreground font-bold rounded-xl border border-primary/20 hover:bg-primary hover:text-white transition-colors cursor-default">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="bg-white/50 dark:bg-black/30 rounded-3xl p-6 border text-center">
                <div className="text-5xl font-black font-heading text-amber-500 mb-2">4,280</div>
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
          {[
            { name: "Sarah J.", text: "Alex's design tips literally saved my final project! So helpful.", avatar: "SJ" },
            { name: "Prof. Davis", text: "Outstanding contribution to the campus app redesign. A joy to have in class.", avatar: "PD" },
            { name: "Mike T.", text: "Best coffee recommendations on campus ☕️🔥", avatar: "MT" }
          ].map((comment, i) => (
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
          
          <div className="bg-dashed border-2 border-dashed border-border p-6 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <p className="font-bold text-muted-foreground group-hover:text-primary">Leave some love</p>
          </div>
        </div>
      </div>
    </div>
  );
}