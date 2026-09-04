import { NextResponse } from "next/server";
import { z } from "zod";
import { requireEntitledUser } from "@/lib/requireEntitlement";

const Schema = z.object({
  prompt: z.string().min(5).max(3000),
});

export async function POST(request: Request) {
  const denied = await requireEntitledUser();
  if (denied) return denied;

  try {
    const parsed = Schema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid prompt." },
        { status: 400 },
      );
    }

    const aiUrl =
      process.env.SENTINEL_AI_URL ||
      process.env.LOCAL_AI_URL ||
      "http://localhost:8787";

    const response = await fetch(`${aiUrl}/generate-building`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: parsed.data.prompt,
      }),
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Sentinel Nexus AI failed.",
      },
      { status: 500 },
    );
  }
}
