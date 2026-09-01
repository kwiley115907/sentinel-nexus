import EnterpriseModule from "@/components/enterprise/EnterpriseModule";

export default function Page() {
  return (
    <EnterpriseModule
      storageKey="alarm-core-ai-blueprint"
      title="4. AI Blueprint Intelligence"
      subtitle="Track AI detections, blueprint recognition results, and review pending suggestions."
      fields={["detected device", "confidence", "sheet", "review status"]}
    />
  );
}
