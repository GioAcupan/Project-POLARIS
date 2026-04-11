export default function Dashboard() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="rounded-xl border border-border bg-card p-4 lg:col-span-3">
          <h2 className="text-sm font-semibold text-foreground">Intelligence Column</h2>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 lg:col-span-6">
          <h2 className="text-sm font-semibold text-foreground">Map Panel</h2>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 lg:col-span-3">
          <h2 className="text-sm font-semibold text-foreground">Detail Panel</h2>
        </section>
      </div>
    </div>
  )
}
