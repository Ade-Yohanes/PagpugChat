import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q") || "";
    const searxUrl = process.env.NEXT_PUBLIC_WEB_SEARXNG_URL;

    if (!searxUrl) {
      return NextResponse.json(
        { error: "Web search URL not configured" },
        { status: 500 }
      );
    }

    if (!query.trim()) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    console.log(`[API Search] Proxying search request for: "${query}" to ${searxUrl}`);

    const response = await fetch(
      `${searxUrl}/search?q=${encodeURIComponent(query)}&format=json`
    );

    if (!response.ok) {
      console.error(
        `[API Search] SearXNG error: status ${response.status}`
      );
      return NextResponse.json(
        { error: `SearXNG error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Search] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}