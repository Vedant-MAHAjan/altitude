export default function TrekDetailLoading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12 md:py-16">
      <section className="space-y-4 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-border md:p-12">
        <div className="flex gap-2">
          <div className="skeleton h-6 w-16 rounded-full" />
          <div className="skeleton h-6 w-20 rounded-full" />
        </div>
        <div className="skeleton h-10 w-2/3 rounded-xl" />
        <div className="skeleton h-4 w-full max-w-lg rounded-lg" />
        <div className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      </section>
      <div className="space-y-4">
        <div className="skeleton h-14 rounded-2xl" />
        <div className="skeleton h-72 rounded-2xl" />
      </div>
    </main>
  );
}
