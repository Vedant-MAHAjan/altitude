import { getTrekComparison } from "@/lib/data";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/treks/[slug]">,
) {
  const { slug } = await context.params;
  const trek = await getTrekComparison(slug);

  if (!trek) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(
    { trek },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}