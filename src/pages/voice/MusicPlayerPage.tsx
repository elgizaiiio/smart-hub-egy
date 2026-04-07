import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, Share2, Play, Pause, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import "./VoiceCallLoader.css";

const MusicPlayerPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [song, setSong] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!id) return;
    // Check if it's the sample track
    if (id === "sample") {
      setSong({
        id: "sample",
        title: "Egypt — Beauty in Simplicity",
        prompt: "Cinematic ambient track inspired by Egyptian nights",
        audio_url: "/audio/sample-track.mp3",
      });
      return;
    }
    supabase
      .from("generated_songs")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) setSong(data);
      });
  }, [id]);

  const updateProgress = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    } else {
      audioRef.current.play();
      animationRef.current = requestAnimationFrame(updateProgress);
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = () => {
    if (!song?.audio_url) return;
    const a = document.createElement("a");
    a.href = song.audio_url;
    a.download = `${(song.title || "track").replace(/\s+/g, "-")}.mp3`;
    a.target = "_blank";
    a.click();
  };

  const handleShare = () => {
    const url = `${window.location.origin}/voice/music/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!song) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background">
        <div className="loader-wrapper">
          <div className="loader" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-violet-950/40 via-background to-background" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => navigate("/voice/music")}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p className="text-xs text-muted-foreground truncate flex-1">{song.title}</p>
      </div>

      {/* Main content - Animated orb like voice call */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Loader animation - same as voice call */}
        <div className="loader-wrapper" style={{ width: 200, height: 200 }}>
          <div
            className="loader"
            style={{
              animationDuration: isPlaying ? "2s" : "6s",
              opacity: isPlaying ? 1 : 0.5,
            }}
          />
          {/* Play/Pause button in center */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={togglePlay}
            className="relative z-10 w-16 h-16 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 text-white" fill="white" />
            ) : (
              <Play className="w-7 h-7 text-white ml-1" fill="white" />
            )}
          </motion.button>
        </div>

        {/* Song info */}
        <div className="mt-8 text-center space-y-2">
          <h2 className="text-lg font-bold text-foreground">{song.title}</h2>
          <p className="text-xs text-muted-foreground max-w-[280px] line-clamp-2">{song.prompt}</p>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs mt-8 space-y-2">
          <div
            className="w-full h-1 rounded-full bg-white/10 cursor-pointer"
            onClick={(e) => {
              if (!audioRef.current) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              audioRef.current.currentTime = pct * audioRef.current.duration;
            }}
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="relative z-10 pb-12 px-6 flex items-center justify-center gap-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleDownload}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-sm text-foreground text-sm font-medium"
        >
          <Download className="w-4 h-4" /> Download
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleShare}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-sm text-foreground text-sm font-medium"
        >
          <Share2 className="w-4 h-4" /> Share
        </motion.button>
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={song.audio_url}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onEnded={() => {
          setIsPlaying(false);
          if (animationRef.current) cancelAnimationFrame(animationRef.current);
        }}
      />
    </div>
  );
};

export default MusicPlayerPage;
