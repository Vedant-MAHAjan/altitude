"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function TreksError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <h2 className="font-display text-2xl font-bold text-foreground">
        Failed to load trek data
      </h2>
      <p className="text-sm text-muted-foreground">
        Our comparison data may be temporarily unavailable. Try again in a moment.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="outline">
          Retry
        </Button>
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}
