import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, UserPlus, LogIn } from "lucide-react";
import authBg from "@/assets/images/auth-bg.png";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate auth
    setTimeout(() => {
      setIsSubmitting(false);
      setLocation("/home");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-stretch bg-background">
      {/* Left Side - Visuals */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-primary/10">
        <img 
          src={authBg} 
          alt="Floating 3D emojis" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-secondary/40" />
        
        <div className="relative z-10 flex flex-col justify-center p-16 h-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <div className="w-16 h-16 rounded-3xl bg-white shadow-xl shadow-black/5 flex items-center justify-center mb-8">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-6xl font-heading font-black text-white leading-tight mb-6 drop-shadow-lg">
              Find your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-none">vibe.</span><br/>
              Share your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500 drop-shadow-none">joy.</span>
            </h1>
            <p className="text-xl text-white/90 font-medium max-w-md bg-black/20 p-6 rounded-3xl backdrop-blur-md border border-white/20">
              "HappinessHub is where campus culture comes alive. Share moments, find quests, and level up your college experience."
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-24 relative">
        <div className="absolute top-8 right-8">
          <Button 
            variant="ghost" 
            className="rounded-full px-6"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Need an account?" : "Already have an account?"}
          </Button>
        </div>

        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-heading font-bold mb-3">
              {isLogin ? "Welcome back!" : "Join the Hub"}
            </h2>
            <p className="text-muted-foreground text-lg">
              {isLogin 
                ? "Ready to catch up on the campus vibes?" 
                : "Create an account to start sharing smiles."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Joyful Student" 
                    className="h-14 rounded-2xl bg-white dark:bg-zinc-900 border-2 focus-visible:ring-0 focus-visible:border-primary text-lg px-4 transition-all" 
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email">Campus Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@campus.edu" 
                required
                className="h-14 rounded-2xl bg-white dark:bg-zinc-900 border-2 focus-visible:ring-0 focus-visible:border-primary text-lg px-4 transition-all" 
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                {isLogin && (
                  <a href="#" className="text-sm font-semibold text-primary hover:underline">
                    Forgot it?
                  </a>
                )}
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                required
                className="h-14 rounded-2xl bg-white dark:bg-zinc-900 border-2 focus-visible:ring-0 focus-visible:border-primary text-lg px-4 transition-all" 
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl text-lg font-bold shadow-dopamine hover:shadow-dopamine-hover transition-all duration-300 relative overflow-hidden group"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <motion.div 
                  className="w-6 h-6 border-4 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <span className="flex items-center gap-2 relative z-10">
                  {isLogin ? "Let's Go" : "Create Account"}
                  {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </span>
              )}
              {/* Button shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </Button>
          </form>

        </motion.div>
      </div>
    </div>
  );
}