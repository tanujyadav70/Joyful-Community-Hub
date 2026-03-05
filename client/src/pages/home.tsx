import { useState } from "react";
import { motion } from "framer-motion";
import { SmilePlus, Heart, MessageCircle, Share2, Sparkles, Image as ImageIcon, Music as MusicIcon, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const MOCK_POSTS = [
  {
    id: 1,
    author: { name: "Sarah Jenkins", avatar: "SJ", role: "Design Student" },
    type: "Talent Showcase",
    content: "Just finished my final project for 3D modeling class! Took 40 hours but totally worth it. ✨",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
    likes: 124,
    comments: 18,
    time: "2h ago",
    gradient: "from-purple-500/20 to-pink-500/20"
  },
  {
    id: 2,
    author: { name: "Dr. Marcus Chen", avatar: "MC", role: "Computer Science Dept" },
    type: "Positive Vibes",
    content: "Incredibly proud of the hackathon teams this weekend. The energy in the lab was contagious. Reminder: taking breaks is just as important as coding! Grab some coffee. ☕️",
    likes: 342,
    comments: 45,
    time: "4h ago",
    gradient: "from-amber-500/20 to-orange-500/20"
  },
  {
    id: 3,
    author: { name: "Campus Band 'The Locals'", avatar: "TB", role: "Music Club" },
    type: "Music Clip",
    content: "Snippet from yesterday's quad performance! Thanks to everyone who came out to vibe with us under the sun. 🎸☀️",
    likes: 56,
    comments: 8,
    time: "5h ago",
    gradient: "from-cyan-500/20 to-blue-500/20"
  }
];

export default function HomeFeed() {
  const [postContent, setPostContent] = useState("");

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
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="Share a smile or positive moment..."
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none text-lg placeholder:text-muted-foreground/60 min-h-[60px]"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="rounded-xl text-primary hover:bg-primary/10 hover:text-primary">
              <ImageIcon className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl text-secondary hover:bg-secondary/10 hover:text-secondary">
              <Video className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl text-accent hover:bg-accent/10 hover:text-accent">
              <MusicIcon className="w-5 h-5" />
            </Button>
          </div>
          <Button 
            className="rounded-full px-6 font-bold shadow-md hover:shadow-lg transition-shadow"
            disabled={!postContent.trim()}
          >
            <SmilePlus className="w-4 h-4 mr-2" />
            Share Joy
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
        {MOCK_POSTS.map((post, i) => (
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
              
              {post.image && (
                <div className="relative h-64 sm:h-80 rounded-3xl overflow-hidden shadow-inner">
                  <img src={post.image} alt="Post content" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-6 pt-4">
                <button className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors group/btn">
                  <div className="p-2 rounded-full group-hover/btn:bg-accent/10 transition-colors">
                    <Heart className="w-6 h-6" />
                  </div>
                  <span className="font-semibold">{post.likes}</span>
                </button>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors group/btn">
                  <div className="p-2 rounded-full group-hover/btn:bg-secondary/10 transition-colors">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <span className="font-semibold">{post.comments}</span>
                </button>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group/btn ml-auto">
                  <div className="p-2 rounded-full group-hover/btn:bg-primary/10 transition-colors">
                    <Share2 className="w-6 h-6" />
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}