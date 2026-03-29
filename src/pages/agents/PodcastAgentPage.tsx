import AgentPageLayout from "@/components/AgentPageLayout";

const SYSTEM = `You are an AI Podcast Creator Agent. You help users create professional podcasts:
- Research topics using web search
- Write engaging podcast scripts with natural dialogue
- Generate high-quality audio using text-to-speech
- Support multiple voices and languages
- Create episode outlines and show notes

Workflow:
1. Understand the topic from the user
2. Research using web search
3. Write a compelling script
4. Present the script for approval/editing
5. After approval, generate audio
6. Save to Voice section

Always respond in the user's language.`;

const PodcastAgentPage = () => (
  <AgentPageLayout
    title="AI Podcast"
    subtitle="Create professional podcasts with AI"
    systemPrompt={SYSTEM}
    mode="agent-podcast"
    placeholder="What topic should the podcast cover?"
  />
);

export default PodcastAgentPage;
