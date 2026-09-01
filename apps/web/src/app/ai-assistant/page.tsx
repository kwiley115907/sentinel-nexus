import EnterpriseModule from "@/components/enterprise/EnterpriseModule";

export default function Page() {
  return (
    <EnterpriseModule
      storageKey="alarm-core-ai-assistant"
      title="13. AI Assistant"
      subtitle="Track AI commands, generated reports, estimates, and blueprint suggestions."
      fields={["prompt", "result", "review status", "saved action"]}
    />
  );
}
