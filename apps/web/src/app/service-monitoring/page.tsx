import EnterpriseModule from "@/components/enterprise/EnterpriseModule";

export default function Page() {
  return (
    <EnterpriseModule
      storageKey="alarm-core-service-monitoring"
      title="10. Service & Monitoring"
      subtitle="Track service tickets, recurring inspections, monitoring accounts, and alarm history."
      fields={["ticket", "site", "panel", "monitoring account", "service note"]}
    />
  );
}
