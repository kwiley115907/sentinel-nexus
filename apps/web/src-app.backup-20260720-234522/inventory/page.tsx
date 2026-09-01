import EnterpriseModule from "@/components/enterprise/EnterpriseModule";

export default function Page() {
  return (
    <EnterpriseModule
      storageKey="alarm-core-inventory"
      title="6. Inventory System"
      subtitle="Track warehouse stock, truck stock, parts, devices, and reorder needs."
      fields={["part number", "quantity", "truck", "warehouse", "vendor"]}
    />
  );
}
