import AgentPageLayout from "@/components/AgentPageLayout";

const SYSTEM = `You are an AI News Agent. You help users stay informed:
- Fetch the latest news on any topic
- Filter by categories (Tech, Business, Sports, Science, etc.)
- Present news in the user's language
- Provide summaries and analysis
- Track developing stories
- Compare coverage across sources

Use web search to find the most recent and relevant news.
Present each news item with: headline, source, summary, and significance.
Always respond in the user's language.`;

const NewsAgentPage = () => (
  <AgentPageLayout
    title="News Agent"
    subtitle="Get latest news in your language"
    systemPrompt={SYSTEM}
    mode="agent-news"
    placeholder="What news topic interests you?"
  />
);

export default NewsAgentPage;
