import { motion } from "framer-motion";
import { Sparkles, Trophy, Target, Zap, ChevronRight, Medal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

type UpcomingQuest = {
  title: string;
  time: string;
  type: string;
};

type Badge = {
  name: string;
  icon: string;
  color: string;
};

type ActivityData = {
  weeklyPosts: number;
  contributionBreakdown: { name: string; value: number }[];
  joyGrowth: { date: string; points: number }[];
  pointsBreakdown: {
    questsJoined: { count: number; points: number };
    postsShared: { count: number; points: number };
    likesReceived: { count: number; points: number };
    eventsOrganized: { count: number; points: number };
  };
  rank: number;
  totalUsers: number;
  leaderboard: { rank: number; name: string; avatar: string; score: number }[];
};

type StudentDashboardData = {
  name: string;
  level: number;
  quote: string;
  happinessPoints: number;
  profileImage?: string;
  rankPercent: number;
  nextLevelPercent: number;
  upcoming: UpcomingQuest[];
  badges: Badge[];
  activityData: ActivityData;
};

const DEFAULT_BADGES: Badge[] = [
  { name: "Zen Master", icon: "🧘‍♀️", color: "from-emerald-400 to-teal-500" },
  { name: "Code Wizard", icon: "💻", color: "from-blue-400 to-indigo-500" },
  { name: "Vibe Setter", icon: "🎸", color: "from-purple-400 to-pink-500" },
  { name: "Social Butterfly", icon: "🦋", color: "from-amber-400 to-orange-500" },
];

export default function StudentDashboard() {
  const { data, isLoading } = useQuery<StudentDashboardData>({
    queryKey: ["/api/student/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="glass-card rounded-[2.5rem] p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const name = data?.name ?? "Joyful User";
  const level = data?.level ?? 1;
  const quote = data?.quote ?? '"Spreading positive vibes since Day 1! 🌻"';
  const happinessPoints = data?.happinessPoints ?? 0;
  const profileImage = data?.profileImage;
  const rankPercent = data?.rankPercent ?? 100;
  const nextLevelPercent = data?.nextLevelPercent ?? 0;
  const upcoming = data?.upcoming ?? [];
  const badges = data?.badges ?? [];
  const activityData = data?.activityData;

  return (
    <div className="space-y-8">
      {/* Header Profile Section */}
      <div className="glass-card rounded-[2.5rem] p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-dopamine rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/4" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-dopamine rounded-full animate-spin-slow opacity-70 group-hover:opacity-100 transition-opacity blur-md" />
            <Avatar className="w-32 h-32 border-4 border-white shadow-xl relative z-10">
              <AvatarImage src={profileImage} />
              <AvatarFallback>{name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-4xl font-heading font-black">{name}</h1>
              <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                Level {level}
              </div>
            </div>
            <p className="text-xl text-muted-foreground font-medium mb-4">
              {quote}
            </p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="bg-white/50 dark:bg-black/50 backdrop-blur px-4 py-2 rounded-2xl flex items-center gap-2 border">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span className="font-bold text-lg">
                  {happinessPoints.toLocaleString()} HP
                </span>
                <span className="text-xs text-muted-foreground uppercase">(Happiness Pts)</span>
              </div>
              <div className="bg-white/50 dark:bg-black/50 backdrop-blur px-4 py-2 rounded-2xl flex items-center gap-2 border">
                <Trophy className="w-5 h-5 text-blue-500" />
                <span className="font-bold text-lg">
                  #{activityData?.rank || 'N/A'}
                </span>
                <span className="text-xs text-muted-foreground uppercase">
                  of {activityData?.totalUsers || 0} users
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Stats & Badges */}
        <div className="lg:col-span-2 space-y-8">
          {/* Points Breakdown */}
          {activityData?.pointsBreakdown && (
            <div className="glass-card rounded-[2rem] p-6 md:p-8">
              <h3 className="text-2xl font-bold font-heading mb-6">Points Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">Quests Joined</span>
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="text-3xl font-black text-primary mb-1">
                    {activityData.pointsBreakdown.questsJoined.count}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activityData.pointsBreakdown.questsJoined.points} points earned
                  </div>
                </div>
                <div className="bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">Posts Shared</span>
                    <span className="text-2xl">📝</span>
                  </div>
                  <div className="text-3xl font-black text-primary mb-1">
                    {activityData.pointsBreakdown.postsShared.count}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activityData.pointsBreakdown.postsShared.points} points earned
                  </div>
                </div>
                <div className="bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">Likes Received</span>
                    <span className="text-2xl">❤️</span>
                  </div>
                  <div className="text-3xl font-black text-primary mb-1">
                    {activityData.pointsBreakdown.likesReceived.count}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activityData.pointsBreakdown.likesReceived.points} points earned
                  </div>
                </div>
                <div className="bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">Events Organized</span>
                    <span className="text-2xl">🎪</span>
                  </div>
                  <div className="text-3xl font-black text-primary mb-1">
                    {activityData.pointsBreakdown.eventsOrganized.count}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activityData.pointsBreakdown.eventsOrganized.points} points earned
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          {activityData?.leaderboard && activityData.leaderboard.length > 0 && (
            <div className="glass-card rounded-[2rem] p-6 md:p-8">
              <h3 className="text-2xl font-bold font-heading mb-6">Joy Leaderboard</h3>
              <div className="space-y-3">
                {activityData.leaderboard.map((user) => (
                  <div key={user.rank} className="flex items-center gap-4 p-3 bg-white/50 dark:bg-black/20 rounded-2xl">
                    <div className="text-2xl font-bold text-primary w-8">
                      {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : `#${user.rank}`}
                    </div>
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{user.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-bold">{user.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{user.score} 🌟</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              {badges.map((badge, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5, scale: 1.05 }}
                  className={`aspect-square rounded-3xl bg-gradient-to-br ${badge.color} p-1 shadow-lg cursor-pointer group relative`}
                  title={`${badge.name} - Earned!`}
                >
                  <div className="w-full h-full bg-white/20 backdrop-blur-md rounded-[1.4rem] flex flex-col items-center justify-center p-2 text-center text-white">
                    <span className="text-4xl mb-2 drop-shadow-md">{badge.icon}</span>
                    <span className="font-bold text-sm leading-tight text-shadow-sm">{badge.name}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Activity Graphs */}
          {activityData && (
            <>
              {/* Weekly Activity */}
              <div className="glass-card rounded-[2rem] p-6 md:p-8">
                <h3 className="text-2xl font-bold font-heading mb-6">Weekly Joy Activity</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[{ week: 'This Week', posts: activityData.weeklyPosts }]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="posts" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Contribution Breakdown */}
              <div className="glass-card rounded-[2rem] p-6 md:p-8">
                <h3 className="text-2xl font-bold font-heading mb-6">Contribution Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={activityData.contributionBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {activityData.contributionBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#8884d8', '#82ca9d', '#ffc658'][index % 3]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Joy Growth Over Time */}
              <div className="glass-card rounded-[2rem] p-6 md:p-8">
                <h3 className="text-2xl font-bold font-heading mb-6">Joy Points Growth</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activityData.joyGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="points" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        {/* Right Column - Feed */}
        <div className="space-y-8">
          
        </div>

      </div>
    </div>
  );
}