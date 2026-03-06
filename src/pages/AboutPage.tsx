import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground mb-6 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-foreground mb-3">About Megsy</h1>
            <p className="text-muted-foreground">The next generation AI platform</p>
          </div>

          <div className="prose-chat">
            <p className="text-foreground leading-relaxed">
              Megsy is an AI-powered platform built in Egypt, designed to make artificial intelligence accessible to everyone. 
              Our platform offers chat, image generation, video creation, file processing, and code generation capabilities.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold text-foreground mb-4">Founders</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold mb-2">H</div>
                <h3 className="font-display font-semibold text-foreground">Hamza Hassan Al-Jazairi</h3>
                <p className="text-xs text-muted-foreground">Co-Founder</p>
              </div>
              <div className="p-4 rounded-xl border border-border">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold mb-2">A</div>
                <h3 className="font-display font-semibold text-foreground">Abdullah Mohamed Amira</h3>
                <p className="text-xs text-muted-foreground">Co-Founder</p>
              </div>
            </div>
          </div>

          <div className="text-center pt-4 text-xs text-muted-foreground">
            <p>Megsy &copy; {new Date().getFullYear()} — Made in Egypt</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage;
