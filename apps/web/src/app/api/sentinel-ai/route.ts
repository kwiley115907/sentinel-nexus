import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireEntitledUser } from "@/lib/requireEntitlement";

const Schema = z.object({
  question: z.string().min(3).max(2000),
  notes: z.string().max(8000).optional(),
  files: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  const denied = await requireEntitledUser();
  if (denied) return denied;

  const parsed = Schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const client = new OpenAI({
    apiKey: process.env.AI_API_KEY,
  });

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: `
You are Sentinel AI, an assistant for fire alarm, camera, security, and low-voltage construction.

Rules:
- Do not help bypass, disable, exploit, or misuse alarm/security/camera systems.
- Help with blueprints, device schedules, wire schedules, inspections, estimates, reports, and documentation.
- Give practical field-ready answers.

Uploaded files:
${parsed.data.files?.join("\n") || "No files uploaded."}

Project notes:
${parsed.data.notes || "No notes provided."}

Question:
${parsed.data.question}
`,
  });

  return NextResponse.json({ answer: response.output_text });
}
