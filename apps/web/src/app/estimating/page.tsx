import EnterpriseModule from "@/components/enterprise/EnterpriseModule";

export default function Page() {
  return (
    <EnterpriseModule
      storageKey="alarm-core-estimating"
      title="3. Estimating System"
      subtitle="Build quotes from devices, wire footage, labor hours, and material takeoffs."
      fields={["device count", "wire footage", "labor hours", "margin", "quote notes"]}
    />
  );
}
