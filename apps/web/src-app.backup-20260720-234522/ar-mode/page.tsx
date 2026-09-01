import EnterpriseModule from "@/components/enterprise/EnterpriseModule";

export default function Page() {
  return (
    <EnterpriseModule
      storageKey="alarm-core-ar-mode"
      title="12. AR Mode"
      subtitle="Plan augmented reality overlays for devices, wire paths, and wall locations."
      fields={["room", "device", "AR marker", "overlay note", "field check"]}
    />
  );
}
