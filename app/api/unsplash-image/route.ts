import { NextRequest, NextResponse } from "next/server";

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY || "";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "clothing";

  if (!UNSPLASH_KEY) {
    return NextResponse.json({ url: null, error: "No Unsplash key" });
  }

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=squarish`,
      { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } }
    );
    const data = await res.json();
    const url = data.results?.[0]?.urls?.small || null;
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ url: null });
  }
}
