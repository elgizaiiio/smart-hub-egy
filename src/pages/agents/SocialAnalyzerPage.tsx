import AgentPageLayout from "@/components/AgentPageLayout";

const SYSTEM = `You are a Social Media Analyzer Agent. You help users analyze social media accounts and posts:
- Analyze public profiles from any platform (Instagram, Twitter/X, TikTok, Facebook, YouTube)
- Provide engagement metrics and insights
- Analyze post performance
- Suggest content strategies
- Compare accounts
- Track trends

Accept URLs to profiles or posts. Use web search to gather public information.
Present findings in clear, structured formats with actionable insights.
Always respond in the user's language.`;

const SocialAnalyzerPage = () => (
  <AgentPageLayout
    title="Social Analyzer"
    subtitle="Analyze social media accounts & posts"
    systemPrompt={SYSTEM}
    mode="agent-social"
    placeholder="Paste a social media profile or post URL..."
  />
);

export default SocialAnalyzerPage;
