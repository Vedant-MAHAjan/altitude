export default function DestinationCityLoading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12 md:py-16">
      <section className="space-y-4 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-border md:p-12">
        <div className="skeleton h-10 w-2/3 rounded-xl" />
        <div className="skeleton h-4 w-40 rounded-lg" />
        <div className="skeleton h-4 w-full max-w-md rounded-lg" />
      </section>
      <div className="space-y-4">
        <div className="skeleton h-14 rounded-2xl" />
        <div className="skeleton h-72 rounded-2xl" />
      </div>
    </main>
  );
}
