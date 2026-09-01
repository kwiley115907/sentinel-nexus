import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const aiUrl = (process.env.SENTINEL_AI_URL || "").replace(/\/$/, "");

    if (!aiUrl) {
      return NextResponse.json(
        { error: "Missing SENTINEL_AI_URL in Vercel." },
        { status: 500 },
      );
    }

    const response = await fetch(`${aiUrl}/gateway`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await response.text();

    try {
      return NextResponse.json(JSON.parse(text), { status: response.status });
    } catch {
      return NextResponse.json(
        {
          error: "AI server did not return JSON.",
          status: response.status,
          preview: text.slice(0, 300),
        },
        { status: 502 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sentinel AI failed." },
      { status: 500 },
    );
  }
}
