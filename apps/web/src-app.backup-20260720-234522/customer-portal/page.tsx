import EnterpriseModule from "@/components/enterprise/EnterpriseModule";

export default function Page() {
  return (
    <EnterpriseModule
      storageKey="alarm-core-customer-portal"
      title="9. Customer Portal"
      subtitle="Share progress, reports, approvals, and project updates with customers."
      fields={["customer", "approval", "shared report", "message", "status"]}
    />
  );
}
