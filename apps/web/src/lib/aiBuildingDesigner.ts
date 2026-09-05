import OpenAI from "openai";

// This is the actual "AI" in "AI building generator" - everywhere else in
// the 3D Builder (AiImporter.ts's baseProgram) is a fixed rulebook: match a
// keyword in the prompt, return one of a handful of hand-authored floor
// plans. That's fast and free but can only ever build what someone already
// wrote a rule for - anything else (a mall, a gym, a church) either falls
// through to the wrong template or the generic default. This calls a real
// model to design the floor plan itself, for any building described in
// plain English, using the same AI_API_KEY already configured for the
// Sentinel AI assistant (see /api/sentinel-ai, /api/ai/project-assistant).

export type DesignedRoom = {
  id: string;
  label: string;
  x: number;
  z: number;
  width: number;
  depth: number;
};

export type DesignedBuilding = {
  stories: number;
  rooms: DesignedRoom[];
};

const SYSTEM_PROMPT = `You are a building floor-plan designer for a fire-alarm/low-voltage CAD tool.
Given a plain-English description of a building, respond with STRICT JSON only - no markdown, no
commentary, no code fences - matching exactly this shape:

{"stories": <integer 1-20>, "rooms": [{"id": "<short-slug>", "label": "<display name>", "x": <number>, "z": <number>, "width": <number>, "depth": <number>}, ...]}

Rules:
- Design ONE floor's worth of rooms; every floor is assumed identical and gets stacked automatically by the caller - do not repeat rooms per floor yourself.
- x/z are the room's CENTER point in feet on a flat 2D floor plan, width/depth are the room's size in feet.
- Rooms must not overlap: leave at least 0.5 ft of gap between adjacent room edges.
- Typical room sizes are 6-20 ft wide/deep. A wide, thin room with "corridor" somewhere in its id (e.g. "corridor", "main-corridor") is optional but recommended for larger buildings so there is a clear circulation path.
- Match the EXACT count and type of rooms/spaces requested - e.g. "60 stores, 20 per floor" means exactly 20 store rooms in your single-floor design (the caller multiplies by the floor count itself). If no count is given, use professional judgment for that building type.
- Give each room a short, human label (e.g. "Store 4", "Exam Room 2", "Break Room").
- Keep the total room count reasonable for a CAD viewer - never exceed 150 rooms.
- Respond with ONLY the JSON object. No prose before or after it.`;

export async function designBuilding(prompt: string): Promise<DesignedBuilding | null> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new OpenAI({ apiKey });

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `${SYSTEM_PROMPT}\n\nBuilding request:\n${prompt}`,
    });

    const raw = (response.output_text || "").trim();
    const jsonText = raw.startsWith("```")
      ? raw.replace(/^```(?:json)?\n?/, "").replace(/```\s*$/, "").trim()
      : raw;

    const parsed = JSON.parse(jsonText);

    if (!Array.isArray(parsed?.rooms) || parsed.rooms.length === 0) {
      return null;
    }

    const rooms: DesignedRoom[] = parsed.rooms.slice(0, 150).map((room: any, index: number) => ({
      id: String(room?.id || `room-${index + 1}`).slice(0, 60),
      label: String(room?.label || `Room ${index + 1}`).slice(0, 80),
      x: Number(room?.x) || 0,
      z: Number(room?.z) || 0,
      width: Math.min(60, Math.max(3, Number(room?.width) || 8)),
      depth: Math.min(60, Math.max(3, Number(room?.depth) || 6)),
    }));

    const stories = Math.min(20, Math.max(1, Math.round(Number(parsed?.stories)) || 1));

    return { stories, rooms };
  } catch {
    // Bad/missing key, network failure, malformed JSON - any of these mean
    // "couldn't design it", not "crash the request". Callers fall back to
    // the deterministic template system.
    return null;
  }
}
