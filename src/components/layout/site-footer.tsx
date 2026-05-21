export function SiteFooter() {
  return (
    <footer className="border-t border-white/50 bg-white/50">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>
          MahaTrek Compare is designed for a zero-cost MVP: Vercel, Neon, GitHub
          Actions, and Playwright.
        </p>
        <p>Scrape twice daily, normalize with enums, and ship SEO-friendly comparison pages.</p>
      </div>
    </footer>
  );
}