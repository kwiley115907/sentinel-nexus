import { NextResponse } from "next/server";
import { requireEntitledUser } from "@/lib/requireEntitlement";
import { rateLimit } from "@/lib/rateLimit";
import { designBuilding } from "@/lib/aiBuildingDesigner";
import { convertAiBlueprintToCad } from "@/components/cad/importers/AiImporter";

const BUILDING_REQUEST_TYPES = new Set([
  "blueprint-generator",
  "building",
  "blueprint",
  "generate-building",
]);

export async function POST(request: Request) {
  const denied = await requireEntitledUser();
  if (denied) return denied;

  try {
    const body = await request.json();
    const requestType = String(body?.requestType || "").trim().toLowerCase();
    const prompt = String(body?.prompt || "").trim();

    if (BUILDING_REQUEST_TYPES.has(requestType) && prompt) {
      const ip = request.headers.get("x-forwarded-for") || "local";
      const limited = rateLimit(`ai-building:${ip}`, 8, 60_000);

      if (!limited.ok) {
        return NextResponse.json(
          { success: false, error: "Too many building requests. Try again in a minute." },
          { status: 429 },
        );
      }

      // Real AI generation first - designs the actual floor plan for
      // whatever was asked, not just whichever fixed template's keyword
      // happened to match. Falls back to the legacy external service, and
      // finally to the local deterministic templates, so a request never
      // just fails outright even with no AI_API_KEY configured or if that
      // call errors.
      const designed = await designBuilding(prompt);

      if (designed) {
        return NextResponse.json({
          success: true,
          type: "blueprint-generator",
          stories: designed.stories,
          rooms: designed.rooms,
        });
      }

      const aiUrl = (process.env.SENTINEL_AI_URL || "").replace(/\/$/, "");

      if (aiUrl) {
        try {
          const response = await fetch(`${aiUrl}/gateway`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            cache: "no-store",
          });

          const text = await response.text();
          const parsed = JSON.parse(text);

          if (Array.isArray(parsed?.rooms) && parsed.rooms.length > 0) {
            return NextResponse.json(parsed, { status: response.status });
          }
        } catch {
          // fall through to local templates below
        }
      }

      const cad = convertAiBlueprintToCad({ prompt });

      return NextResponse.json({
        success: true,
        type: "blueprint-generator",
        stories: cad.stories,
        rooms: cad.rooms,
      });
    }

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
