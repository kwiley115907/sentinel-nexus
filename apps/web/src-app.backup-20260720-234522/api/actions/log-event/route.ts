import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rateLimit";

const EventSchema = z.object({
  type: z.string().min(2).max(80),
  message: z.string().min(1).max(500),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  const limited = rateLimit(`action:${ip}`, 30, 60_000);

  if (!limited.ok) {
    return NextResponse.json({ error: "Too many action requests. Try again later." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = EventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  console.log("[Sentinel Nexus Event]", {
    ...parsed.data,
    time: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
