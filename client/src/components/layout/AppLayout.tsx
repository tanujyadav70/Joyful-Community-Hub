import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  Calendar, 
  LayoutDashboard, 
  UserCircle, 
  LogOut,
  Sparkles,
  Music
} from "lucide-react";
import MusicPlayer from "../shared/MusicPlayer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AppLayoutProps {
  children: React.ReactNode;
}

// navigation entries; admin link is added dynamically below once we know the user role
const baseNavItems = [
  { href: "/home", icon: Home, label: "Community Feed" },
  { href: "/events", icon: Calendar, label: "Happiness Quests" },
  { href: "/student/dashboard", icon: LayoutDashboard, label: "My Joy Stats" },
  { href: "/profile/me", icon: UserCircle, label: "My Vibe Bio" },
];


export default function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: currentUser, isLoading: isAuthLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn<{ id: string; username: string; name?: string }>({
      on401: "returnNull",
    }),
  });

  useEffect(() => {
    if (!isAuthLoading && currentUser === null) {
      setLocation("/login");
    }
  }, [currentUser, isAuthLoading, setLocation]);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/login");
    } catch (err: any) {
      toast({
        title: "Logout failed",
        description: err?.message || "Something went wrong while logging you out.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-[280px] h-screen sticky top-0 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-3xl border-r border-white/60 p-6 z-40">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-2xl bg-gradient-dopamine flex items-center justify-center text-white shadow-dopamine">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Happiness<span className="text-primary">Hub</span></h1>
        </div>

        <nav className="flex-1 flex flex-col gap-3">
          {(() => {
            const navItems = [
              ...baseNavItems,
              ...(currentUser && (currentUser as any).isAdmin ? [{ href: "/admin/dashboard", icon: Sparkles, label: "Faculty Command" }] : []),
            ];
            return navItems.map((item) => {
              const isActive = location === item.href || (location === "/" && item.href === "/home");
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: [-10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <item.icon
                      className={`w-6 h-6 ${
                        isActive ? "text-primary-foreground" : "group-hover:text-primary"
                      }`}
                    />
                  </motion.div>
                  <span className="font-semibold text-lg">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 w-2 h-10 bg-primary rounded-r-full"
                    />
                  )}
                </Link>
              );
            });
          })()}
        </nav>

        <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-primary/20">
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-sm">
                {currentUser?.name || "Joyful User"}
              </p>
              <p className="text-xs text-muted-foreground">Level 42 Optimist</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-24 md:pb-28">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between p-4 glass border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-dopamine flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-heading font-bold text-foreground">HappinessHub</h1>
          </div>
          <Avatar className="w-8 h-8 border-2 border-primary/20">
            <AvatarFallback>JU</AvatarFallback>
          </Avatar>
        </div>

        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
              transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Persistent Music Player */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:pl-[280px]">
        <MusicPlayer />
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-[72px] left-0 right-0 z-40 glass border-t flex justify-around p-2">
        {baseNavItems.map((item) => {
          const isActive = location === item.href || (location === "/" && item.href === "/home");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`p-3 rounded-2xl flex flex-col items-center gap-1 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-6 h-6" />
              {isActive && <div className="w-1 h-1 bg-primary rounded-full" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}