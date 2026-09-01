import EnterpriseModule from "@/components/enterprise/EnterpriseModule";

export default function Page() {
  return (
    <EnterpriseModule
      storageKey="alarm-core-field-mode"
      title="11. Real-Time Field Mode"
      subtitle="Manage live field updates, install statuses, job notes, and technician progress."
      fields={["technician", "device", "status", "photo note", "timestamp"]}
    />
  );
}
