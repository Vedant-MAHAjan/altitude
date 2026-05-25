export default function OrganizersLoading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-12 md:py-16">
      <section className="space-y-4">
        <div className="skeleton h-6 w-24 rounded-full" />
        <div className="skeleton h-12 w-72 rounded-xl" />
        <div className="skeleton h-5 w-96 rounded-lg" />
      </section>
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-border">
            <div className="flex justify-between">
              <div className="skeleton h-5 w-16 rounded-full" />
              <div className="skeleton h-4 w-20 rounded" />
            </div>
            <div className="skeleton h-6 w-3/4 rounded-lg" />
            <div className="skeleton h-4 w-full rounded-lg" />
            <div className="skeleton h-4 w-2/3 rounded-lg" />
          </div>
        ))}
      </section>
    </main>
  );
}
