import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const MAX_RESULTS = 10;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (query.length < 3) {
    return NextResponse.json({ error: "Query too short" }, { status: 400 });
  }

  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("countrycodes", "au");
    url.searchParams.set("limit", String(MAX_RESULTS));

    const res = await fetch(url.toString(), {
      headers: {
        "Accept-Language": "en-AU",
        "User-Agent": "vigyanit-academy/1.0 (contact@vigyanitacademy.com)",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Lookup failed" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Address search error:", error);
    return NextResponse.json({ error: "Lookup error" }, { status: 500 });
  }
}
