// src/app/cad-bim/page.tsx

import EnterpriseModule from "@/components/enterprise/EnterpriseModule";

export default function Page() {
  return (
    <div className="space-y-6">
      <a
        href="/blueprint-3d"
        className="inline-block rounded-xl bg-yellow-400 px-6 py-4 font-black text-black"
      >
        Open 3D CAD Builder
      </a>

      <EnterpriseModule
        storageKey="alarm-core-cad-bim"
        title="8. CAD / BIM Integration"
        subtitle="Manage CAD, Revit, PDF, and blueprint import/export workflows."
        fields={[
          "file name",
          "revision",
          "source",
          "import status",
          "export notes",
        ]}
      />
    </div>
  );
}
