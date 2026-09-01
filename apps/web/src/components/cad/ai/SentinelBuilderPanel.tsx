"use client";

import { useState } from "react";

import type {
  SentinelBuilderApplyResult,
  SentinelBuilderCommand,
} from "@/lib/sentinel-builder/SentinelBuilderTypes";

type SentinelBuilderPanelProps = {
  model: unknown;
  activeFloor: number | "ALL";
  selectedId: string;

  onApplyCommands: (
    commands: SentinelBuilderCommand[],
  ) => SentinelBuilderApplyResult;
};

type BuilderPlanResponse = {
  requestId?: string;
  summary?: string;
  commands?: SentinelBuilderCommand[];
  warnings?: Array<
    | string
    | {
        message?: string;
      }
  >;
  error?: string;
};

export default function SentinelBuilderPanel({
  model,
  activeFloor,
  selectedId,
  onApplyCommands,
}: SentinelBuilderPanelProps) {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] =
    useState<BuilderPlanResponse | null>(null);
  const [status, setStatus] = useState("");

  async function createPlan() {
    const trimmedInstruction = instruction.trim();

    if (!trimmedInstruction) {
      setStatus("Enter an instruction for Sentinel.");
      return;
    }

    setLoading(true);
    setStatus("");
    setPlan(null);

    try {
      const response = await fetch(
        "/api/sentinel/builder/plan",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            instruction: trimmedInstruction,

            context: {
              model,
              activeFloor,
              selectedId,
            },
          }),
        },
      );

      const data =
        (await response.json()) as BuilderPlanResponse;

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Sentinel could not create a builder plan.",
        );
      }

      setPlan(data);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Sentinel request failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  function applyPlan() {
    const commands = plan?.commands ?? [];

    if (commands.length === 0) {
      setStatus("There are no commands to apply.");
      return;
    }

    const result = onApplyCommands(commands);

    if (result.success) {
      setStatus(
        `Applied ${result.appliedCommandIds.length} Sentinel change(s).`,
      );
      return;
    }

    setStatus(
      [
        `Applied: ${result.appliedCommandIds.length}`,
        `Rejected: ${result.rejectedCommandIds.length}`,
        ...result.errors.map(
          (item) =>
            `${item.commandId}: ${item.message}`,
        ),
      ].join("\n"),
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        style={{
          position: "fixed",
          right: "18px",
          bottom: "18px",
          zIndex: 1000,
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "999px",
          padding: "12px 18px",
          background: "#111827",
          color: "white",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {open ? "Close Sentinel" : "Sentinel AI"}
      </button>

      {open ? (
        <aside
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            width: "min(420px, 94vw)",
            zIndex: 999,
            overflowY: "auto",
            padding: "22px",
            background: "rgba(8, 15, 28, 0.98)",
            color: "white",
            borderLeft:
              "1px solid rgba(255,255,255,0.14)",
            boxShadow:
              "-14px 0 40px rgba(0,0,0,0.35)",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            Sentinel AI Builder
          </h2>

          <p
            style={{
              color: "#cbd5e1",
              lineHeight: 1.5,
            }}
          >
            Ask Sentinel to inspect or propose changes
            to the current blueprint.
          </p>

          <div
            style={{
              marginBottom: "14px",
              padding: "10px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.06)",
              fontSize: "14px",
            }}
          >
            <div>
              Active floor:{" "}
              <strong>{String(activeFloor)}</strong>
            </div>

            <div>
              Selected object:{" "}
              <strong>{selectedId || "None"}</strong>
            </div>
          </div>

          <label
            htmlFor="sentinel-builder-instruction"
            style={{
              display: "block",
              marginBottom: "7px",
              fontWeight: 600,
            }}
          >
            Builder instruction
          </label>

          <textarea
            id="sentinel-builder-instruction"
            value={instruction}
            onChange={(event) =>
              setInstruction(event.target.value)
            }
            placeholder="Example: Inspect the current model and explain why the windows appear on a missing second floor."
            rows={7}
            style={{
              width: "100%",
              boxSizing: "border-box",
              resize: "vertical",
              borderRadius: "10px",
              border:
                "1px solid rgba(255,255,255,0.18)",
              padding: "12px",
              background: "#111827",
              color: "white",
              font: "inherit",
            }}
          />

          <button
            type="button"
            onClick={createPlan}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "12px",
              border: 0,
              borderRadius: "10px",
              padding: "12px",
              background: loading
                ? "#475569"
                : "#2563eb",
              color: "white",
              fontWeight: 700,
              cursor: loading
                ? "wait"
                : "pointer",
            }}
          >
            {loading
              ? "Sentinel is analyzing..."
              : "Analyze blueprint"}
          </button>

          {plan ? (
            <section
              style={{
                marginTop: "20px",
                paddingTop: "18px",
                borderTop:
                  "1px solid rgba(255,255,255,0.14)",
              }}
            >
              <h3>Proposed plan</h3>

              <p
                style={{
                  color: "#e2e8f0",
                  lineHeight: 1.5,
                }}
              >
                {plan.summary ||
                  "Sentinel returned a plan."}
              </p>

              <p>
                Commands:{" "}
                <strong>
                  {plan.commands?.length ?? 0}
                </strong>
              </p>

              {plan.commands?.map((command) => (
                <div
                  key={command.id}
                  style={{
                    marginBottom: "10px",
                    padding: "10px",
                    borderRadius: "8px",
                    background:
                      "rgba(255,255,255,0.06)",
                  }}
                >
                  <strong>{command.action}</strong>

                  <div
                    style={{
                      marginTop: "4px",
                      color: "#cbd5e1",
                      fontSize: "14px",
                    }}
                  >
                    {command.targetId
                      ? `Target: ${command.targetId}`
                      : "No existing target"}
                  </div>

                  {command.reason ? (
                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "14px",
                      }}
                    >
                      {command.reason}
                    </div>
                  ) : null}
                </div>
              ))}

              <button
                type="button"
                onClick={applyPlan}
                disabled={
                  !plan.commands ||
                  plan.commands.length === 0
                }
                style={{
                  width: "100%",
                  marginTop: "8px",
                  border: 0,
                  borderRadius: "10px",
                  padding: "12px",
                  background: "#15803d",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Apply approved changes
              </button>
            </section>
          ) : null}

          {status ? (
            <pre
              style={{
                marginTop: "15px",
                whiteSpace: "pre-wrap",
                color: "#fca5a5",
                fontFamily: "inherit",
              }}
            >
              {status}
            </pre>
          ) : null}
        </aside>
      ) : null}
    </>
  );
}
