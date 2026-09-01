export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-5xl rounded-3xl border border-yellow-400/30 bg-black/30 p-8 backdrop-blur-sm">
        <h1 className="text-4xl font-black text-yellow-300">Terms & Conditions</h1>
        <p className="mt-4 text-yellow-100/80">Effective Date: 2026</p>

        <section className="mt-8 space-y-5 text-yellow-50/90">
          <p>By using Sentinel Nexus, you agree to these Terms & Conditions.</p>

          <h2 className="text-2xl font-black text-yellow-300">Permitted Use</h2>
          <p>Sentinel Nexus is intended for fire alarm, camera, security, low-voltage, blueprint, inspection, project management, reporting, and documentation workflows.</p>

          <h2 className="text-2xl font-black text-yellow-300">Prohibited Use</h2>
          <p>Users may not use Sentinel Nexus to bypass, disable, exploit, damage, tamper with, or misuse alarm, camera, security, access control, or life-safety systems.</p>

          <h2 className="text-2xl font-black text-yellow-300">Professional Responsibility</h2>
          <p>Sentinel Nexus does not replace licensed engineering, AHJ approval, code review, manufacturer documentation, professional judgment, or field verification.</p>

          <h2 className="text-2xl font-black text-yellow-300">Blueprints and Uploads</h2>
          <p>Users are responsible for ensuring they have permission to upload, view, store, edit, and share any drawings, reports, photos, or project files.</p>

          <h2 className="text-2xl font-black text-yellow-300">AI Output</h2>
          <p>AI-generated content may contain mistakes. Users must review and verify all estimates, reports, device schedules, wire schedules, and recommendations before use.</p>

          <h2 className="text-2xl font-black text-yellow-300">Accounts</h2>
          <p>Users are responsible for maintaining account security and for all activity occurring under their account.</p>

          <h2 className="text-2xl font-black text-yellow-300">Availability</h2>
          <p>We may update, change, suspend, or discontinue features at any time. We do not guarantee uninterrupted availability.</p>

          <h2 className="text-2xl font-black text-yellow-300">Limitation of Liability</h2>
          <p>Sentinel Nexus is provided as software support for documentation and workflow. Users remain responsible for final decisions, field conditions, compliance, and project outcomes.</p>

          <h2 className="text-2xl font-black text-yellow-300">Contact</h2>
          <p>Questions about these Terms can be sent through the Contact page.</p>
        </section>

        <a href="/login" className="mt-8 inline-block rounded-xl bg-yellow-400 px-5 py-3 font-black text-black">Back</a>
      </div>
    </main>
  );
}
