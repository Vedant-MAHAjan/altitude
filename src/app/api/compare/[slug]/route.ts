import { getTrekComparison } from "@/lib/data";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/compare/[slug]">,
) {
  const { slug } = await context.params;
  const comparison = await getTrekComparison(slug);

  if (!comparison) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(
    {
      comparison,
      filters: comparison.filters,
      summaryTable: comparison.summaryTable,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}