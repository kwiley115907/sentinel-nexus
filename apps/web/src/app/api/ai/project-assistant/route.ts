import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rateLimit";
import { requireEntitledUser } from "@/lib/requireEntitlement";

const RequestSchema = z.object({
  question: z.string().min(3).max(1500),
  project: z.unknown(),
});

export async function POST(request: Request) {
  const denied = await requireEntitledUser();
  if (denied) return denied;

  const ip = request.headers.get("x-forwarded-for") || "local";
  const limited = rateLimit(`ai-project:${ip}`, 8, 60_000);

  if (!limited.ok) {
    return NextResponse.json({ error: "Too many AI requests. Try again later." }, { status: 429 });
  }

  const parsed = RequestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid AI request." }, { status: 400 });
  }

  const client = new OpenAI({
    apiKey: process.env.AI_API_KEY,
  });

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: `
You are Sentinel Nexus AI for fire alarm, camera, security, and low-voltage construction.

Safety rules:
- Do not help bypass, disable, exploit, damage, or misuse alarm/security/camera systems.
- Help only with planning, estimating, documentation, inspections, reports, wire schedules, device schedules, and project organization.

User question:
${parsed.data.question}

Project data:
${JSON.stringify(parsed.data.project).slice(0, 12000)}
`,
  });

  return NextResponse.json({
    answer: response.output_text,
  });
}
