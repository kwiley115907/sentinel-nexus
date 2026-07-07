const express = require("express");
const cors = require("cors");
const { z } = require("zod");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const schema = z.object({
  requestType: z.string().optional(),
  prompt: z.string().optional().default(""),
  blueprint: z.any().optional(),
});

function room(id, label, x, y, width, height) {
  return { id, name: label, label, x, y, z: y, width, height, depth: height, layer: "ARCHITECTURE", shape: "RECTANGLE" };
}

function device(id, type, label, x, y) {
  return { id, type, label, x, y, z: y, size: 42, layer: "FIRE_ALARM" };
}

function storiesFrom(prompt) {
  const m = prompt.toLowerCase().match(/(\d+)\s*(story|stories|floor|floors)/);
  return m ? Number(m[1]) : prompt.toLowerCase().includes("two story") ? 2 : 1;
}

function typeFrom(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes("hospital")) return "hospital";
  if (p.includes("school")) return "school";
  if (p.includes("warehouse")) return "warehouse";
  if (p.includes("hotel")) return "hotel";
  if (p.includes("office")) return "office";
  if (p.includes("restaurant")) return "restaurant";
  if (p.includes("apartment")) return "apartment";
  return "house";
}

function baseRooms(type) {
  if (type === "hospital") return [
    room("lobby", "Lobby", 10, 10, 24, 16),
    room("triage", "Triage", 38, 10, 18, 14),
    room("exam1", "Exam Room 1", 10, 32, 16, 14),
    room("exam2", "Exam Room 2", 30, 32, 16, 14),
    room("nurse", "Nurse Station", 52, 30, 18, 16),
  ];

  if (type === "school") return [
    room("lobby", "Main Lobby", 35, 8, 18, 10),
    room("class1", "Classroom 1", 10, 25, 18, 14),
    room("class2", "Classroom 2", 32, 25, 18, 14),
    room("cafeteria", "Cafeteria", 15, 48, 26, 18),
    room("gym", "Gym", 50, 48, 28, 22),
  ];

  if (type === "warehouse") return [
    room("warehouse", "Open Warehouse", 10, 10, 70, 42),
    room("office", "Shipping Office", 85, 10, 18, 14),
    room("dock", "Loading Dock", 85, 30, 22, 18),
  ];

  return [
    room("living", "Living Room", 10, 10, 22, 18),
    room("kitchen", "Kitchen", 36, 10, 16, 14),
    room("bed1", "Bedroom 1", 10, 34, 16, 14),
    room("bed2", "Bedroom 2", 30, 34, 16, 14),
    room("bath", "Bathroom", 50, 34, 10, 10),
  ];
}

function build(prompt = "") {
  const type = typeFrom(prompt);
  const stories = storiesFrom(prompt);
  const rooms = [];

  for (let f = 1; f <= stories; f++) {
    const offset = (f - 1) * 85;
    baseRooms(type).forEach(r => {
      rooms.push({
        ...r,
        id: `${r.id}-f${f}`,
        label: `${r.label} - F${f}`,
        name: `${r.name} - F${f}`,
        y: r.y + offset,
        z: r.y + offset,
        floor: f,
        stories,
      });
    });
  }

  const walls = rooms.flatMap(r => {
    const x1 = r.x, y1 = r.y, x2 = r.x + r.width, y2 = r.y + r.height;
    return [
      { id: `wall-${r.id}-n`, x1, y1, x2, y2: y1, layer: "ARCHITECTURE" },
      { id: `wall-${r.id}-e`, x1: x2, y1, x2, y2, layer: "ARCHITECTURE" },
      { id: `wall-${r.id}-s`, x1, y1: y2, x2, y2, layer: "ARCHITECTURE" },
      { id: `wall-${r.id}-w`, x1, y1, x2: x1, y2, layer: "ARCHITECTURE" },
    ];
  });

  const doors = rooms.map(r => ({
    id: `door-${r.id}`,
    x: r.x + r.width / 2,
    y: r.y,
    z: r.y,
    width: 3,
    label: "Door",
    layer: "ARCHITECTURE",
  }));

  const windows = rooms.map(r => ({
    id: `window-${r.id}`,
    x: r.x + r.width / 2,
    y: r.y + r.height,
    z: r.y + r.height,
    width: 4,
    label: "Window",
    layer: "ARCHITECTURE",
  }));

  const devices = rooms.flatMap((r, i) => [
    device(`sd-${i + 1}`, "SMOKE", "SD", r.x + r.width / 2, r.y + r.height / 2),
    device(`hs-${i + 1}`, "HORN_STROBE", "HS", r.x + 2, r.y + 2),
  ]);

  return {
    type: "blueprint-generator",
    buildingType: type,
    prompt,
    stories,
    rooms,
    walls,
    doors,
    windows,
    devices,
    notes: [`Generated ${stories}-story ${type}. Verify final code compliance with AHJ.`],
  };
}

app.get("/", (_req, res) => res.json({ status: "online" }));

app.post("/gateway", (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request." });

  const { requestType, prompt, blueprint } = parsed.data;

  if (requestType === "device-placement") {
    const rooms = blueprint?.rooms || [];
    return res.json({
      type: "device-placement",
      devices: rooms.flatMap((r, i) => [
        device(`sd-${i + 1}`, "SMOKE", "SD", r.x + r.width / 2, r.y + r.depth / 2),
        device(`hs-${i + 1}`, "HORN_STROBE", "HS", r.x + 2, r.y + 2),
      ]),
    });
  }

  return res.json(build(prompt));
});

app.post("/generate-building", (req, res) => {
  res.json(build(req.body.prompt || ""));
});

app.get("/generate-building", (req, res) => {
  res.json(build(String(req.query.prompt || "")));
});

const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`Sentinel Nexus AI running on port ${port}`));
