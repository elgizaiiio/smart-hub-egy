import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mic, MicOff, PhoneOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import "./VoiceCallLoader.css";

const VoiceCallPage = () => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startCall = useCallback(async () => {
    try {
      // Get Deepgram key
      const { data: keys } = await supabase
        .from("api_keys")
        .select("api_key")
        .eq("service", "deepgram")
        .eq("is_active", true)
        .limit(5);

      if (!keys || keys.length === 0) {
        console.error("No Deepgram keys available");
        setIsConnecting(false);
        return;
      }

      const apiKey = keys[Math.floor(Math.random() * keys.length)].api_key;

      // Get user mic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 48000, channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      mediaStreamRef.current = stream;

      // Connect WebSocket to Deepgram Agent API
      const ws = new WebSocket("wss://agent.deepgram.com/agent", ["token", apiKey]);
      wsRef.current = ws;

      ws.onopen = () => {
        // Send settings
        ws.send(JSON.stringify({
          type: "Settings",
          audio: {
            input: { encoding: "linear16", sample_rate: 48000 },
            output: { encoding: "linear16", sample_rate: 24000, container: "none" },
          },
          agent: {
            language: "multi",
            speak: {
              provider: { type: "eleven_labs", model_id: "eleven_multilingual_v2", voice_id: "DtsPFCrhbCbbJkwZsb3d" },
            },
            listen: {
              provider: { type: "deepgram", version: "v1", model: "nova-3" },
            },
            think: {
              provider: { type: "google", model: "gemini-2.5-flash" },
              prompt: `You are Megsy, a smart, friendly AI companion. Adapt your tone to the user. Match their language and dialect. Be natural, warm and helpful. Never say you're an AI unless asked. Keep responses concise for voice conversation. Current year is 2026.`,
            },
            greeting: "مرحبا! كيف أقدر أساعدك اليوم؟",
          },
        }));

        setIsConnected(true);
        setIsConnecting(false);

        // Start timer
        timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);

        // Start sending audio
        const audioContext = new AudioContext({ sampleRate: 48000 });
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (isMuted || ws.readyState !== WebSocket.OPEN) return;
          const input = e.inputBuffer.getChannelData(0);
          const buffer = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            buffer[i] = Math.max(-32768, Math.min(32767, Math.floor(input[i] * 32768)));
          }
          ws.send(buffer.buffer);
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
      };

      ws.onmessage = async (event) => {
        if (event.data instanceof Blob) {
          // Audio response from agent
          const arrayBuffer = await event.data.arrayBuffer();
          audioQueueRef.current.push(arrayBuffer);
          if (!isPlayingRef.current) playNextAudio();
        } else {
          // JSON message (transcript, etc.)
          try {
            const msg = JSON.parse(event.data);
            console.log("Agent message:", msg.type);
          } catch {}
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
      };

      ws.onerror = () => {
        setIsConnected(false);
        setIsConnecting(false);
      };
    } catch (err) {
      console.error("Call error:", err);
      setIsConnecting(false);
    }
  }, []);

  const playNextAudio = async () => {
    if (audioQueueRef.current.length === 0) { isPlayingRef.current = false; return; }
    isPlayingRef.current = true;
    const buffer = audioQueueRef.current.shift()!;

    try {
      const audioContext = audioContextRef.current || new AudioContext({ sampleRate: 24000 });
      if (!audioContextRef.current) audioContextRef.current = audioContext;

      const int16 = new Int16Array(buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;

      const audioBuffer = audioContext.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => playNextAudio();
      source.start();
    } catch {
      playNextAudio();
    }
  };

  const endCall = () => {
    if (wsRef.current) wsRef.current.close();
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
    if (processorRef.current) processorRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    if (timerRef.current) clearInterval(timerRef.current);
    navigate("/voice");
  };

  useEffect(() => {
    startCall();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
      if (processorRef.current) processorRef.current.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startCall]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      {/* Back button */}
      <div className="absolute top-4 left-4 z-10">
        <button onClick={endCall} className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Animated orb loader */}
        <div className="loader-wrapper">
          <div className="loader" />
          <span className="loader-letter" style={{ animationDelay: "0s" }}>M</span>
          <span className="loader-letter" style={{ animationDelay: "0.1s" }}>e</span>
          <span className="loader-letter" style={{ animationDelay: "0.2s" }}>g</span>
          <span className="loader-letter" style={{ animationDelay: "0.3s" }}>s</span>
          <span className="loader-letter" style={{ animationDelay: "0.4s" }}>y</span>
        </div>

        {/* Status text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 text-sm text-muted-foreground"
        >
          {isConnecting ? "Connecting..." : isConnected ? formatTime(callDuration) : "Disconnected"}
        </motion.p>
      </div>

      {/* Bottom controls */}
      <div className="pb-12 flex items-center justify-center gap-8">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsMuted(!isMuted)}
          className={`w-14 h-14 flex items-center justify-center rounded-full transition-colors ${
            isMuted ? "bg-destructive/20 text-destructive" : "bg-secondary text-foreground"
          }`}
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
      </div>
    </div>
  );
};

export default VoiceCallPage;
