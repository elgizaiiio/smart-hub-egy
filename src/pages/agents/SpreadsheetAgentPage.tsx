import AgentPageLayout from "@/components/AgentPageLayout";

const SYSTEM = `You are an AI Spreadsheet Agent. You help users create and analyze spreadsheets:
- Generate CSV/Excel data from descriptions
- Analyze uploaded data files
- Create formulas and calculations
- Generate charts and summaries
- Support budgets, trackers, inventories, and more
When creating files, save them to the Files section.
Always respond in the user's language.`;

const SpreadsheetAgentPage = () => (
  <AgentPageLayout
    title="AI Spreadsheets"
    subtitle="Create & analyze spreadsheets with AI"
    systemPrompt={SYSTEM}
    mode="agent-spreadsheet"
    placeholder="Describe the spreadsheet you need..."
  />
);

export default SpreadsheetAgentPage;
