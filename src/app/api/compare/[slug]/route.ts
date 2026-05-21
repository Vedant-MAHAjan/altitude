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

  return Response.json({
    comparison,
    filters: {
      transportTypes: [...new Set(comparison.packages.map((item) => item.transportType))],
      mealPlans: [...new Set(comparison.packages.map((item) => item.mealPlan))],
      organizers: [...new Set(comparison.packages.map((item) => item.organizerSlug))],
    },
  });
}