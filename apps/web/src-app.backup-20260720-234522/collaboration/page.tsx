import EnterpriseModule from "@/components/enterprise/EnterpriseModule";

export default function Page() {
  return (
    <EnterpriseModule
      storageKey="alarm-core-collaboration"
      title="5. Live Collaboration"
      subtitle="Coordinate office staff, designers, project managers, and field technicians."
      fields={["user", "comment", "assigned page", "change request"]}
    />
  );
}
