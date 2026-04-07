import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, PhoneOff, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import "./VoiceCallLoader.css";

const VoiceCallPage = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"idle" | "connecting" | "connected" | "ended">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [statusText, setStatusText] = useState("Tap to start call");
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMutedRef = useRef(false);

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  const playNextAudio = useCallback(async () => {
    if (audioQueueRef.current.length === 0) { isPlayingRef.current = false; return; }
    isPlayingRef.current = true;
    const buffer = audioQueueRef.current.shift()!;
    try {
      const ctx = audioContextRef.current || new AudioContext({ sampleRate: 24000 });
      if (!audioContextRef.current) audioContextRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();
      const int16 = new Int16Array(buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;
      const ab = ctx.createBuffer(1, float32.length, 24000);
      ab.getChannelData(0).set(float32);
      const source = ctx.createBufferSource();
      source.buffer = ab;
      source.connect(ctx.destination);
      source.onended = () => playNextAudio();
      source.start();
    } catch { playNextAudio(); }
  }, []);

  const startCall = useCallback(async () => {
    setPhase("connecting");
    setStatusText("Getting access...");

    try {
      // 1. Request mic permission first
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { sampleRate: 48000, channelCount: 1, echoCancellation: true, noiseSuppression: true }
        });
      } catch (micErr: any) {
        setPhase("idle");
        if (micErr.name === "NotAllowedError" || micErr.name === "PermissionDeniedError") {
          setStatusText("Microphone permission denied. Please allow access.");
          toast.error("Please allow microphone access in your browser settings");
        } else {
          setStatusText("Microphone not available");
          toast.error("Could not access microphone");
        }
        return;
      }
      mediaStreamRef.current = stream;

      // 2. Get Deepgram token
      setStatusText("Connecting to AI...");
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke("deepgram-token", {
        body: { ttl_seconds: 60 },
      });
      if (tokenError || !tokenData?.token) {
        stream.getTracks().forEach(t => t.stop());
        setPhase("idle");
        setStatusText("Connection failed. Try again.");
        toast.error("Could not connect to voice service");
        return;
      }

      // 3. Connect WebSocket
      setStatusText("Starting voice agent...");
      const ws = new WebSocket("wss://agent.deepgram.com/v1/agent/converse", ["token", tokenData.token]);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: "Settings",
          audio: {
            input: { encoding: "linear16", sample_rate: 48000 },
            output: { encoding: "linear16", sample_rate: 24000, container: "none" },
          },
          agent: {
            language: "multi",
            think: {
              prompt: `You are Megsy, a smart, friendly AI companion. Adapt your tone to the user. Match their language and dialect. Be natural, warm and helpful. Never say you're an AI unless asked. Keep responses concise for voice conversation. Current year is 2026.`,
            },
            greeting: "مرحبا! كيف أقدر أساعدك اليوم؟",
          },
        }));

        setPhase("connected");
        setStatusText("Connected");
        timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);

        const audioContext = new AudioContext({ sampleRate: 48000 });
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (isMutedRef.current || ws.readyState !== WebSocket.OPEN) return;
          const input = e.inputBuffer.getChannelData(0);
          const buf = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) buf[i] = Math.max(-32768, Math.min(32767, Math.floor(input[i] * 32768)));
          ws.send(buf.buffer);
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
      };

      ws.onmessage = async (event) => {
        if (event.data instanceof Blob) {
          const arrayBuffer = await event.data.arrayBuffer();
          audioQueueRef.current.push(arrayBuffer);
          if (!isPlayingRef.current) playNextAudio();
        } else {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "AgentStartedSpeaking") setStatusText("Megsy is speaking...");
            if (msg.type === "UserStartedSpeaking") setStatusText("Listening...");
            if (msg.type === "Error") {
              console.error("Deepgram agent error:", msg);
              setStatusText(msg.description || msg.message || "Voice agent error");
              toast.error(msg.description || msg.message || "Voice call failed");
            }
          } catch {}
        }
      };

      ws.onclose = () => { setPhase("ended"); setStatusText("Call ended"); };
      ws.onerror = () => { setPhase("ended"); setStatusText("Connection lost"); };
    } catch (err) {
      console.error("Call error:", err);
      setPhase("idle");
      setStatusText("Something went wrong. Try again.");
    }
  }, [playNextAudio]);

  const endCall = () => {
    wsRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    processorRef.current?.disconnect();
    audioContextRef.current?.close().catch(() => {});
    if (timerRef.current) clearInterval(timerRef.current);
    navigate("/voice");
  };

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      mediaStreamRef.current?.getTracks().forEach(t => t.stop());
      processorRef.current?.disconnect();
      audioContextRef.current?.close().catch(() => {});
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="loader-wrapper">
          <div className="loader" />
          <span className="loader-letter" style={{ animationDelay: "0s" }}>M</span>
          <span className="loader-letter" style={{ animationDelay: "0.1s" }}>e</span>
          <span className="loader-letter" style={{ animationDelay: "0.2s" }}>g</span>
          <span className="loader-letter" style={{ animationDelay: "0.3s" }}>s</span>
          <span className="loader-letter" style={{ animationDelay: "0.4s" }}>y</span>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 text-sm text-muted-foreground text-center px-6"
        >
          {phase === "connected" ? formatTime(callDuration) : statusText}
        </motion.p>
      </div>

      <div className="pb-12 flex items-center justify-center gap-8">
        {phase === "idle" ? (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={startCall}
            className="w-16 h-16 flex items-center justify-center rounded-full bg-green-500 text-white"
          >
            <Phone className="w-6 h-6" />
          </motion.button>
        ) : phase === "ended" ? (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/voice")}
            className="w-16 h-16 flex items-center justify-center rounded-full bg-secondary text-foreground"
          >
            <PhoneOff className="w-6 h-6" />
          </motion.button>
        ) : (
          <>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMuted(!isMuted)}
              className={`w-14 h-14 flex items-center justify-center rounded-full transition-colors ${isMuted ? "bg-destructive/20 text-destructive" : "bg-secondary text-foreground"}`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={endCall}
              className="w-16 h-16 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground"
            >
              <PhoneOff className="w-6 h-6" />
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
};

export default VoiceCallPage;
