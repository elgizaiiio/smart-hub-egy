import AgentPageLayout from "@/components/AgentPageLayout";

const SYSTEM = `You are an AI Slides Creator Agent. You help users create professional presentations:
- Generate slide content with structured layouts (title, bullets, speaker notes)
- Suggest images for each slide using AI image generation
- Support multiple languages
- Create 5-20 slide presentations based on the topic
- Output each slide as a structured format the system can render
When done, tell the user their presentation has been saved to Files.
Always respond in the user's language.`;

const SlidesAgentPage = () => (
  <AgentPageLayout
    title="AI Slides"
    subtitle="Create professional presentations with AI"
    systemPrompt={SYSTEM}
    mode="agent-slides"
    placeholder="What presentation do you want to create?"
  />
);

export default SlidesAgentPage;
