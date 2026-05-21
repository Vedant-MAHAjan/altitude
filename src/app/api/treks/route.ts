import { getTreksIndex } from "@/lib/data";

export async function GET() {
  const treks = await getTreksIndex();
  return Response.json({ treks });
}