export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-5xl rounded-3xl border border-yellow-400/30 bg-black/30 p-8 backdrop-blur-sm">
        <h1 className="text-4xl font-black text-yellow-300">Privacy Policy</h1>
        <p className="mt-4 text-yellow-100/80">Effective Date: 2026</p>

        <section className="mt-8 space-y-5 text-yellow-50/90">
          <p>
            Sentinel Nexus is a low-voltage construction and project documentation platform used for blueprints,
            devices, wire runs, inspections, punch lists, reports, storage, AI assistance, and project management.
          </p>

          <h2 className="text-2xl font-black text-yellow-300">Information We Collect</h2>
          <p>We may collect account information, email addresses, usernames, authentication provider details, project names, blueprint metadata, uploaded files, device records, wire run records, inspection notes, punch list items, GPS information when enabled, and AI assistant prompts.</p>

          <h2 className="text-2xl font-black text-yellow-300">How We Use Information</h2>
          <p>We use information to provide account access, save project data, manage files, generate reports, support AI features, improve workflow, troubleshoot issues, and protect the security of the platform.</p>

          <h2 className="text-2xl font-black text-yellow-300">Blueprints and Project Files</h2>
          <p>Blueprints, fire alarm plans, camera layouts, inspection reports, and wire schedules may contain sensitive building information. These files should only be uploaded by users authorized to access and manage them.</p>

          <h2 className="text-2xl font-black text-yellow-300">AI Features</h2>
          <p>AI tools may process project notes, device lists, reports, and other information submitted by the user. Users should not submit confidential information unless they are authorized to do so.</p>

          <h2 className="text-2xl font-black text-yellow-300">Data Sharing</h2>
          <p>We do not sell personal data. Data may be processed through trusted service providers used for authentication, storage, hosting, analytics, AI processing, and application functionality.</p>

          <h2 className="text-2xl font-black text-yellow-300">Security</h2>
          <p>We use authentication, access controls, private storage buckets, and server-side environment variables to help protect data. No system can guarantee absolute security.</p>

          <h2 className="text-2xl font-black text-yellow-300">User Responsibilities</h2>
          <p>Users are responsible for protecting account access, using strong passwords, not sharing credentials, and only uploading project data they are authorized to manage.</p>

          <h2 className="text-2xl font-black text-yellow-300">Contact</h2>
          <p>Questions about this Privacy Policy can be sent through the Contact page.</p>
        </section>

        <a href="/login" className="mt-8 inline-block rounded-xl bg-yellow-400 px-5 py-3 font-black text-black">Back</a>
      </div>
    </main>
  );
}
