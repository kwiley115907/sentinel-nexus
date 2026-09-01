import EnterpriseModule from "@/components/enterprise/EnterpriseModule";

export default function Page() {
  return (
    <EnterpriseModule
      storageKey="alarm-core-company-management"
      title="1. Company Management"
      subtitle="Manage employees, roles, permissions, crews, branches, and technician profiles."
      fields={["employee name", "role", "crew", "permissions", "phone", "email"]}
    />
  );
}
