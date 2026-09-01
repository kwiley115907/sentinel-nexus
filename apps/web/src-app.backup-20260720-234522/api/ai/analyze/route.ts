import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rateLimit";

const RequestSchema = z.object({
  prompt: z.string().min(3).max(1200),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  const limited = rateLimit(`ai:${ip}`, 5, 60_000);

  if (!limited.ok) {
    return NextResponse.json({ error: "Too many AI requests. Try again later." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const apiKey = process.env.AI_API_KEY;

  if (!apiKey || apiKey.includes("paste_")) {
    return NextResponse.json({
      result: "AI API key is not configured yet. Add AI_API_KEY to .env.local.",
    });
  }

  const safePrompt = `
You are Sentinel Nexus's assistant for fire alarm and low-voltage project documentation.
Do not provide instructions for bypassing, disabling, damaging, or exploiting alarm/security systems.
Only provide safe planning, documentation, estimating, inspection, and compliance assistance.

User request:
${parsed.data.prompt}
`;

  return NextResponse.json({
    result: `Safe AI request prepared server-side. Connect your provider here.\n\n${safePrompt}`,
  });
}
