import AgentPageLayout from "@/components/AgentPageLayout";

const SYSTEM = `You are a Meeting Notes AI Agent. You help users manage their meetings:
- Summarize meeting recordings uploaded by users
- Extract key action items, decisions, and follow-ups
- Create structured meeting minutes
- Track action items and deadlines
If the user hasn't connected their calendar yet, suggest they connect Google Calendar or Outlook.
Always respond in the user's language.`;

const MeetingNotesPage = () => (
  <AgentPageLayout
    title="Meeting Notes"
    subtitle="Summarize meetings & track action items"
    systemPrompt={SYSTEM}
    mode="agent-meetings"
    placeholder="Upload a recording or describe your meeting..."
  />
);

export default MeetingNotesPage;
