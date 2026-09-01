import EnterpriseModule from "@/components/enterprise/EnterpriseModule";

export default function Page() {
  return (
    <EnterpriseModule
      storageKey="alarm-core-dispatch"
      title="2. Dispatch System"
      subtitle="Schedule technicians, assign jobs, track emergency calls, and organize routes."
      fields={["job", "technician", "date", "priority", "site address"]}
    />
  );
}
