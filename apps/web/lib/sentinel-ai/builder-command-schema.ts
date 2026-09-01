import { z } from "zod";

export const BuilderCommandActionSchema = z.enum([
  "CREATE_OBJECT",
  "UPDATE_OBJECT",
  "DELETE_OBJECT",
  "MOVE_OBJECT",
  "ROTATE_OBJECT",
  "RESIZE_OBJECT",
  "CREATE_STORY",
  "UPDATE_STORY",
  "CREATE_ROOM",
  "CREATE_WALL",
  "CREATE_OPENING",
  "CREATE_DEVICE",
  "ASSIGN_DEVICE_TO_CIRCUIT",
  "CREATE_WIRE_RUN",
  "UPDATE_WIRE_RUN",
  "SET_ACTIVE_STORY",
  "FLAG_CONFLICT",
]);

export const BuilderCommandSchema = z.object({
  id: z.string().min(1),
  action: BuilderCommandActionSchema,
  targetId: z.string().min(1).optional(),
  objectType: z.string().min(1).optional(),
  payload: z.record(z.string(), z.unknown()),
  reason: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  requiresApproval: z.boolean().optional().default(true),
});

export const BuilderCommandPlanSchema = z.object({
  requestId: z.string().min(1),
  summary: z.string().min(1),
  requiresApproval: z.boolean().default(true),
  commands: z.array(BuilderCommandSchema).max(100),
  warnings: z.array(z.string()).default([]),
  missingInformation: z.array(z.string()).default([]),
});

export type ValidatedBuilderCommandPlan = z.infer<
  typeof BuilderCommandPlanSchema
>;
