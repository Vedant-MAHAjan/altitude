import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center px-6 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-4xl">That comparison page does not exist yet.</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            The slug may not have been scraped yet, or it may no longer map to an active organizer package.
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/treks">Browse treks</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/organizers">Browse organizers</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}