export default function ContactPage() {
  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-4xl rounded-3xl border border-yellow-400/30 bg-black/30 p-8 backdrop-blur-sm">
        <h1 className="text-4xl font-black text-yellow-300">Contact Sentinel Nexus</h1>

        <p className="mt-5 text-yellow-100/80">
          For support, account help, project questions, or business inquiries, contact us below.
        </p>

        <div className="mt-8 grid gap-5">
          <div className="rounded-2xl bg-black/25 p-5">
            <p className="text-sm uppercase tracking-[0.25em] text-yellow-300">Phone</p>
            <p className="mt-2 text-2xl font-black">361-356-9024</p>
          </div>

          <div className="rounded-2xl bg-black/25 p-5">
            <p className="text-sm uppercase tracking-[0.25em] text-yellow-300">Email</p>
            <p className="mt-2 text-2xl font-black">alarmcorepro@gmail.com</p>
          </div>

          <div className="rounded-2xl bg-black/25 p-5">
            <p className="text-sm uppercase tracking-[0.25em] text-yellow-300">Prepared By</p>
            <p className="mt-2 text-2xl font-black">K.A. Wiley / Thomas Cantu</p>
          </div>
        </div>

        <a href="/login" className="mt-8 inline-block rounded-xl bg-yellow-400 px-5 py-3 font-black text-black">Back</a>
      </div>
    </main>
  );
}
