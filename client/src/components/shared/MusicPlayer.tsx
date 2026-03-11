import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipForward, SkipBack, Volume2, Heart } from "lucide-react";
import { motion } from "framer-motion";
import musicCover from "@/assets/images/music-cover.png";

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(true);
   const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(
      "/music/Luke-Bergs-Shine-Like-The-Sun(chosic.com).mp3",
    );
    audio.loop = true;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="h-[80px] bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-t border-white/20 dark:border-white/10 flex items-center px-4 md:px-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      
      {/* Track Info */}
      <div className="flex items-center gap-4 w-1/3 min-w-[200px]">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md">
          <img src={musicCover} alt="Cover" className="w-full h-full object-cover" />
          {isPlaying && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center gap-[2px]">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-white rounded-full"
                  animate={{ height: ["4px", "16px", "4px"] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="hidden sm:block">
          <h4 className="font-bold text-sm text-foreground truncate max-w-[150px]">Lofi Beats to Study To</h4>
          <p className="text-xs text-muted-foreground">Chillhop Music</p>
        </div>
        <button 
          onClick={() => setIsLiked(!isLiked)}
          className="ml-2 hidden sm:block"
        >
          <motion.div whileTap={{ scale: 0.8 }}>
            <Heart className={`w-5 h-5 ${isLiked ? "fill-accent text-accent" : "text-muted-foreground"}`} />
          </motion.div>
        </button>
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col items-center max-w-[500px]">
        <div className="flex items-center gap-6">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          
          <button 
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current translate-x-0.5" />
            )}
          </button>

          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full flex items-center gap-3 mt-1 hidden md:flex">
          <span className="text-[10px] text-muted-foreground font-mono">1:24</span>
          <div className="h-1.5 flex-1 bg-secondary/20 rounded-full overflow-hidden group cursor-pointer relative">
            <motion.div 
              className="absolute top-0 left-0 bottom-0 bg-gradient-dopamine w-1/3 rounded-full"
              layoutId="progress"
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">3:45</span>
        </div>
      </div>

      {/* Volume & Extras */}
      <div className="w-1/3 flex items-center justify-end gap-4 hidden lg:flex">
        <Volume2 className="w-5 h-5 text-muted-foreground" />
        <div className="w-24 h-1.5 bg-secondary/20 rounded-full overflow-hidden cursor-pointer">
          <div className="w-2/3 h-full bg-secondary rounded-full" />
        </div>
      </div>
    </div>
  );
}