import { motion } from "framer-motion";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What is Megsy?",
    a: "Megsy is an all-in-one AI creative platform that brings together 80+ AI models for chat, image generation, video creation, code building, and professional image tools -- all in a single unified interface.",
  },
  {
    q: "How does the credit system work?",
    a: "Each AI operation costs a specific number of credits (MC). Simple tasks like chat cost 1 MC, while complex operations like video generation cost more. You receive free credits on signup, and can purchase additional credits or earn them through referrals.",
  },
  {
    q: "What makes Megsy V1 different from other AI models?",
    a: "Megsy V1 is our flagship proprietary model, fine-tuned for exceptional quality across conversation, image generation, and video creation. It combines advanced reasoning with creative capabilities that surpass standard models.",
  },
  {
    q: "Can I use Megsy for commercial projects?",
    a: "Yes. All content generated on Megsy is yours to use commercially. Our Pro and Enterprise plans include full commercial rights for all generated assets.",
  },
  {
    q: "What image and video formats are supported?",
    a: "Images can be generated and exported in PNG, JPEG, and WebP formats at resolutions up to 4K. Videos support MP4 and WebM formats with lengths from 4 to 16 seconds depending on the model.",
  },
  {
    q: "Is there an API available?",
    a: "Yes, Megsy offers a comprehensive REST API for all features. Access image generation, video creation, chat, and tools programmatically. API documentation and SDKs are available for Python, JavaScript, and more.",
  },
  {
    q: "How do referrals work?",
    a: "Share your unique referral code with friends. When they sign up and make their first generation, both you and your friend receive bonus credits. There is no limit to how many people you can refer.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="relative py-24 md:py-32 overflow-hidden">
      {/* Decorative purple shapes */}
      <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-purple-600/10 blur-[100px]" />
      <div className="absolute bottom-20 left-10 w-56 h-56 rounded-full bg-fuchsia-600/8 blur-[80px]" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter text-white leading-none mb-4">
            FA<span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">Qs</span>
          </h2>
          <p className="text-white/40 text-lg">Everything you need to know about Megsy.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-white/10 rounded-xl px-6 bg-white/[0.02] hover:bg-white/[0.04] transition-colors data-[state=open]:border-purple-500/30"
              >
                <AccordionTrigger className="text-white font-semibold text-left hover:no-underline py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-white/50 leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
