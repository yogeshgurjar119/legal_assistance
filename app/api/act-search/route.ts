import { NextResponse, type NextRequest } from "next/server";
import { searchActSections } from "@/lib/act-search";

/** Pure static-data lookup — no external calls, so no rate limiting needed (matches the other read-only GET routes in this app). */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const query = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = searchActSections(query);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("act-search route: unexpected error", err);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
