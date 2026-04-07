import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUp, Loader2, Play, Pause, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppLayout from "@/layouts/AppLayout";
import { motion, AnimatePresence } from "framer-motion";

const HERO_TEXTS = [
  { line1: "CREATE", line2: "MUSIC" },
  { line1: "AI", line2: "COMPOSER" },
  { line1: "YOUR", line2: "SOUND" },
];

const LOADING_TEXTS = [
  { text: "COMPOSING", accent: "YOUR TRACK" },
  { text: "LAYERING", accent: "MELODIES" },
  { text: "MIXING", accent: "THE VIBE" },
  { text: "ALMOST", accent: "READY" },
];

const MusicGeneratorPage = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [songs, setSongs] = useState<any[]>([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [playingSample, setPlayingSample] = useState(false);
  const sampleAudioRef = useRef<HTMLAudioElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Rotate hero text
  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % HERO_TEXTS.length), 3500);
    return () => clearInterval(t);
  }, []);

  // Rotate loading text
  useEffect(() => {
    if (!generating) return;
    const t = setInterval(() => setLoadingIdx(i => (i + 1) % LOADING_TEXTS.length), 2400);
    return () => clearInterval(t);
  }, [generating]);

  // Load user's songs
  useEffect(() => {
    const loadSongs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("generated_songs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setSongs(data);
    };
    loadSongs();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setLoadingIdx(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in");

      const { data, error } = await supabase.functions.invoke("generate-voice", {
        body: { model_id: "suno_music", prompt: prompt.trim(), type: "music" },
      });
      if (error) throw error;

      // Direct completion
      if (data?.status === "completed" && data?.url) {
        const song = await saveSong(user.id, prompt.trim(), data.url, data.title);
        if (song) {
          navigate(`/voice/music/${song.id}`);
        }
        setPrompt("");
        setGenerating(false);
        return;
      }

      // Polling mode
      if (data?.task_id) {
        const taskId = data.task_id;
        const keyId = data.key_id;

        for (let i = 0; i < 40; i++) {
          await new Promise(r => setTimeout(r, 5000)); // 5s intervals instead of 3s
          const { data: pollData } = await supabase.functions.invoke("generate-voice", {
            body: { poll_task_id: taskId, poll_key_id: keyId },
          });

          if (pollData?.status === "completed" && pollData?.url) {
            const song = await saveSong(user.id, prompt.trim(), pollData.url, pollData.title);
            if (song) {
              navigate(`/voice/music/${song.id}`);
            }
            setPrompt("");
            setGenerating(false);
            return;
          }
          if (pollData?.status === "failed") {
            throw new Error(pollData.error || "Generation failed");
          }
        }
        throw new Error("Generation timed out after 3 minutes");
      }

      toast.error("No audio returned");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setGenerating(false);
  };

  const saveSong = async (userId: string, songPrompt: string, audioUrl: string, title?: string) => {
    const { data, error } = await supabase.from("generated_songs").insert({
      user_id: userId,
      prompt: songPrompt,
      audio_url: audioUrl,
      title: title || songPrompt.slice(0, 50),
    }).select().single();

    if (error) {
      console.error("Save song error:", error);
      return null;
    }
    setSongs(prev => [data, ...prev]);
    return data;
  };

  const toggleSample = () => {
    if (!sampleAudioRef.current) return;
    if (playingSample) {
      sampleAudioRef.current.pause();
    } else {
      sampleAudioRef.current.play();
    }
    setPlayingSample(!playingSample);
  };

  const current = HERO_TEXTS[heroIdx];
  const loadingCurrent = LOADING_TEXTS[loadingIdx];

  return (
    <AppLayout onSelectConversation={() => {}} onNewChat={() => {}} activeConversationId={null}>
      <div className="h-full flex flex-col bg-black">
        {/* Header */}
        <div className="sticky top-0 z-10 px-4 py-3 bg-black/80 backdrop-blur-xl flex items-center gap-3">
          <button
            onClick={() => navigate("/voice")}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-foreground">Music</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* Hero text */}
          <div className="pt-6 pb-8 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={heroIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h1 className="text-4xl font-black tracking-tight text-white leading-none">
                  {current.line1}
                </h1>
                <h1 className="text-4xl font-black tracking-tight leading-none mt-1 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                  {current.line2}
                </h1>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Input bar */}
          <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-3">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => {
                setPrompt(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder="Describe the music you want..."
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-white placeholder:text-white/30 py-2 max-h-[120px]"
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || generating}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white disabled:opacity-20 transition-opacity"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
            </button>
          </div>

          {/* Loading state */}
          {generating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex flex-col items-center justify-center py-12 gap-5"
            >
              {/* Star animation like chat ThinkingLoader */}
              <motion.svg
                width="40"
                height="40"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                animate={{
                  y: [0, -8, 0],
                  rotate: [0, 180, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <path
                  d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z"
                  fill="url(#starGrad)"
                />
                <defs>
                  <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </motion.svg>

              <AnimatePresence mode="wait">
                <motion.div
                  key={loadingIdx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="text-center"
                >
                  <p className="text-2xl font-black text-white">{loadingCurrent.text}</p>
                  <p className="text-2xl font-black bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                    {loadingCurrent.accent}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          {/* Songs list or sample */}
          {!generating && (
            <div className="mt-6 space-y-3">
              {songs.length > 0 ? (
                <>
                  <p className="text-xs uppercase tracking-widest text-white/40 font-medium">Your Tracks</p>
                  {songs.map(song => (
                    <motion.button
                      key={song.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/voice/music/${song.id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center shrink-0">
                        <Music className="w-5 h-5 text-violet-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{song.title}</p>
                        <p className="text-xs text-white/40 truncate">{song.prompt}</p>
                      </div>
                      <Play className="w-4 h-4 text-white/40 shrink-0" />
                    </motion.button>
                  ))}
                </>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-widest text-white/40 font-medium">For Example</p>
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className="rounded-2xl overflow-hidden border border-white/10 bg-white/5"
                  >
                    <img
                      src="/images/sample-music-cover.png"
                      alt="Sample track"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4 flex items-center gap-3">
                      <button
                        onClick={toggleSample}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shrink-0"
                      >
                        {playingSample ? (
                          <Pause className="w-4 h-4" fill="white" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" fill="white" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">Egypt — Beauty in Simplicity</p>
                        <p className="text-xs text-white/40">Sample Track · Megsy AI</p>
                      </div>
                    </div>
                  </motion.div>
                  <audio
                    ref={sampleAudioRef}
                    src="/audio/sample-track.mp3"
                    onEnded={() => setPlayingSample(false)}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default MusicGeneratorPage;
