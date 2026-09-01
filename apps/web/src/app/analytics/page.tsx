import EnterpriseModule from "@/components/enterprise/EnterpriseModule";

export default function Page() {
  return (
    <EnterpriseModule
      storageKey="alarm-core-analytics"
      title="14. Smart Analytics"
      subtitle="Monitor labor productivity, inspection results, install speed, and project risk."
      fields={["metric", "period", "value", "trend", "action"]}
    />
  );
}
