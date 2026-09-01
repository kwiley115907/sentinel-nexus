import EnterpriseModule from "@/components/enterprise/EnterpriseModule";

export default function Page() {
  return (
    <EnterpriseModule
      storageKey="alarm-core-multi-office"
      title="15. National Multi-Office Support"
      subtitle="Manage branches, regions, national accounts, and enterprise reporting."
      fields={["branch", "region", "manager", "account", "reporting note"]}
    />
  );
}
