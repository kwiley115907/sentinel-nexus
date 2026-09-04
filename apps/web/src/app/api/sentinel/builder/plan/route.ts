import { NextResponse } from "next/server";
import { requireEntitledUser } from "@/lib/requireEntitlement";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = await requireEntitledUser();
  if (denied) return denied;

  try {
    const aiUrl =
      process.env.SENTINEL_AI_URL?.replace(/\/+$/, "");

    if (!aiUrl) {
      return NextResponse.json(
        {
          error:
            "SENTINEL_AI_URL is not configured.",
        },
        {
          status: 500,
        },
      );
    }

    const requestBody = await request.json();

    const response = await fetch(
      `${aiUrl}/api/builder/plan`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(requestBody),

        cache: "no-store",

        signal: AbortSignal.timeout(600000),
      },
    );

    const responseText = await response.text();

    let data: unknown;

    try {
      data = JSON.parse(responseText);
    } catch {
      data = {
        error:
          responseText ||
          "Sentinel AI returned an invalid response.",
      };
    }

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Sentinel AI request failed.",
      },
      {
        status: 500,
      },
    );
  }
}
