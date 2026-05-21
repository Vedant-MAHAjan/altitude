import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";

type RevalidatePayload = {
  secret?: string;
  trekSlug?: string;
  organizerSlug?: string;
};

export async function POST(request: NextRequest) {
  const payload = ((await request.json().catch(() => null)) ?? {}) as RevalidatePayload;
  const secret = payload.secret ?? request.headers.get("x-revalidate-secret");

  if (!secret || secret !== process.env.CRON_REVALIDATE_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag("treks", "max");
  revalidateTag("organizers", "max");

  if (payload.trekSlug) {
    revalidateTag(`trek:${payload.trekSlug}`, "max");
  }

  if (payload.organizerSlug) {
    revalidateTag(`organizer:${payload.organizerSlug}`, "max");
  }

  return Response.json({
    revalidated: true,
    scope: {
      trekSlug: payload.trekSlug ?? null,
      organizerSlug: payload.organizerSlug ?? null,
    },
  });
}