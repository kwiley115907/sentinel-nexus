import { NextRequest, NextResponse } from "next/server";
import { requireEntitledUser } from "@/lib/requireEntitlement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatRequest = {
  prompt?: string;
  message?: string;
  conversationId?: string;
  blueprint?: unknown;
  projectId?: string;
};

type GatewayResponse = {
  success?: boolean;
  reply?: string;
  response?: string;
  message?: string;
  text?: string;
  answer?: string;
  error?: string;
  [key: string]: unknown;
};

export async function POST(request: NextRequest) {
  const denied = await requireEntitledUser();
  if (denied) return denied;

  try {
    const body = (await request.json()) as ChatRequest;

    const prompt =
      typeof body.prompt === "string"
        ? body.prompt.trim()
        : typeof body.message === "string"
          ? body.message.trim()
          : "";

    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          error: "A prompt or message is required.",
        },
        { status: 400 },
      );
    }

    const aiBaseUrl = process.env.SENTINEL_AI_URL?.trim();

    if (!aiBaseUrl) {
      console.error("SENTINEL_AI_URL is not configured.");

      return NextResponse.json(
        {
          success: false,
          error: "The Sentinel AI service is not configured.",
        },
        { status: 500 },
      );
    }

    /*
     * Your Express server exposes POST /gateway.
     * It does not expose POST /api/chat.
     */
    const aiUrl = `${aiBaseUrl.replace(/\/$/, "")}/gateway`;

    console.log("Forwarding Sentinel chat request to:", aiUrl);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (process.env.SENTINEL_AI_SECRET) {
      headers.Authorization =
        `Bearer ${process.env.SENTINEL_AI_SECRET}`;
    }

    const aiResponse = await fetch(aiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        requestType: "chat",
        prompt,
        message: prompt,
        conversationId: body.conversationId,
        blueprint: body.blueprint,
        projectId: body.projectId,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(120000),
    });

    const responseText = await aiResponse.text();

    let aiData: GatewayResponse;

    try {
      aiData = responseText
        ? (JSON.parse(responseText) as GatewayResponse)
        : {};
    } catch {
      aiData = {
        reply: responseText,
      };
    }

    if (!aiResponse.ok) {
      console.error("Sentinel AI gateway error:", {
        status: aiResponse.status,
        response: aiData,
      });

      return NextResponse.json(
        {
          success: false,
          error:
            aiData.error ||
            "The Sentinel AI service returned an error.",
          details: aiData,
        },
        { status: aiResponse.status },
      );
    }

    /*
     * Normalize the gateway response so SentinelChat.tsx can
     * consistently find the reply.
     */
    const reply =
      aiData.reply ??
      aiData.response ??
      aiData.message ??
      aiData.text ??
      aiData.answer ??
      "";

    return NextResponse.json({
      success: true,
      data: {
        ...aiData,
        reply:
          typeof reply === "string"
            ? reply
            : JSON.stringify(reply, null, 2),
      },
    });
  } catch (error) {
    console.error("Sentinel AI route error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown server error";

    const timedOut =
      message.toLowerCase().includes("timeout") ||
      message.toLowerCase().includes("aborted");

    return NextResponse.json(
      {
        success: false,
        error: timedOut
          ? "The AI service took too long to respond."
          : "Unable to contact the Sentinel AI service.",
        details: message,
      },
      { status: 500 },
    );
  }
}
