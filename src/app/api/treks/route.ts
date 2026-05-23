import { getTreksIndex } from "@/lib/data";

export async function GET() {
  const treks = await getTreksIndex();
  return Response.json(
    { treks },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}