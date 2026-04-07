import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, Disc3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/layouts/AppLayout";

const VoiceStudioPage = () => {
  const navigate = useNavigate();
  const [songs, setSongs] = useState<any[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("generated_songs")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });
      if (data) setSongs(data);
    };
    load();
  }, []);

  const togglePlay = (song: any) => {
    if (!audioRef.current) return;
    if (playingId === song.id) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      audioRef.current.src = song.audio_url;
      audioRef.current.play();
      setPlayingId(song.id);
    }
  };

  return (
    <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
      <div className="h-full flex flex-col bg-background">
        <div className="sticky top-0 z-10 px-4 py-3 bg-background/80 backdrop-blur-xl flex items-center gap-3">
          <button onClick={() => navigate("/voice")} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-foreground">Voice Studio</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {songs.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <Disc3 className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No generated audio yet</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Your generated voices and music will appear here</p>
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              {songs.map(song => (
                <motion.button
                  key={song.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => song.audio_url !== "pending" ? togglePlay(song) : navigate(`/voice/music/${song.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/20 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    {playingId === song.id ? (
                      <Pause className="w-4 h-4 text-primary" />
                    ) : (
                      <Play className="w-4 h-4 text-primary ml-0.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{song.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{song.prompt}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />
      </div>
    </AppLayout>
  );
};

export default VoiceStudioPage;
