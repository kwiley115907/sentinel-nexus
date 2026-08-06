const COPPER_OHMS_PER_1000_FT = {
  18: 6.385,
  16: 4.016,
  14: 2.525,
  12: 1.588,
  10: 0.999,
};

function round(value, digits = 3) {
  const multiplier = 10 ** digits;

  return (
    Math.round(value * multiplier) /
    multiplier
  );
}

function calculateVoltageDrop({
  oneWayLengthFt,
  currentAmps,
  wireGaugeAwg,
  sourceVoltage,
}) {
  const length = Number(oneWayLengthFt);
  const current = Number(currentAmps);
  const gauge = Number(wireGaugeAwg);
  const voltage = Number(sourceVoltage);

  const errors = [];

  if (!Number.isFinite(length) || length <= 0) {
    errors.push(
      "oneWayLengthFt must be greater than zero.",
    );
  }

  if (!Number.isFinite(current) || current < 0) {
    errors.push(
      "currentAmps must be zero or greater.",
    );
  }

  if (!Number.isFinite(voltage) || voltage <= 0) {
    errors.push(
      "sourceVoltage must be greater than zero.",
    );
  }

  const resistancePer1000Ft =
    COPPER_OHMS_PER_1000_FT[gauge];

  if (!resistancePer1000Ft) {
    errors.push(
      `Unsupported wire gauge: ${wireGaugeAwg}. ` +
      `Supported copper gauges: ${Object.keys(
        COPPER_OHMS_PER_1000_FT,
      ).join(", ")} AWG.`,
    );
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    };
  }

  /*
   * The factor of two represents outgoing and return conductor
   * length in a two-conductor DC circuit.
   */
  const circuitLengthFt = length * 2;

  const circuitResistanceOhms =
    (circuitLengthFt / 1000) *
    resistancePer1000Ft;

  const voltageDropVolts =
    current * circuitResistanceOhms;

  const voltageDropPercent =
    (voltageDropVolts / voltage) * 100;

  const estimatedEndVoltage =
    voltage - voltageDropVolts;

  return {
    success: true,
    input: {
      oneWayLengthFt: length,
      currentAmps: current,
      wireGaugeAwg: gauge,
      sourceVoltage: voltage,
      conductorMaterial: "copper",
    },
    result: {
      roundTripLengthFt: round(
        circuitLengthFt,
        2,
      ),
      circuitResistanceOhms: round(
        circuitResistanceOhms,
        4,
      ),
      voltageDropVolts: round(
        voltageDropVolts,
        3,
      ),
      voltageDropPercent: round(
        voltageDropPercent,
        2,
      ),
      estimatedEndVoltage: round(
        estimatedEndVoltage,
        3,
      ),
    },
    assumptions: [
      "Two-conductor DC circuit.",
      "Copper conductor resistance uses nominal reference values.",
      "Connections, temperature, power-supply regulation, appliance minimum operating voltage, synchronization current, and manufacturer-specific factors are not included.",
    ],
    verification:
      "Verify conductor data, alarm current, source terminal voltage, appliance minimum voltage, manufacturer calculation method, approved drawings, and AHJ requirements.",
  };
}

function parseVoltageDropRequest(prompt) {
  const normalized = String(prompt || "");

  const lengthMatch = normalized.match(
    /(?:length|run|distance)\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)\s*(?:ft|feet|foot)?/i,
  );

  const currentMatch = normalized.match(
    /(?:current|amps?|load)\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)\s*(?:a|amps?)?/i,
  );

  const gaugeMatch = normalized.match(
    /(?:awg|gauge|wire)\s*(?:is|=|:|#)?\s*(10|12|14|16|18)\b/i,
  );

  const voltageMatch = normalized.match(
    /(?:voltage|source)\s*(?:is|=|:)?\s*(12|24|28)\s*(?:v|volts?)?/i,
  );

  if (
    !/voltage\s*drop/i.test(normalized) ||
    !lengthMatch ||
    !currentMatch ||
    !gaugeMatch
  ) {
    return null;
  }

  return {
    oneWayLengthFt: Number(lengthMatch[1]),
    currentAmps: Number(currentMatch[1]),
    wireGaugeAwg: Number(gaugeMatch[1]),
    sourceVoltage: voltageMatch
      ? Number(voltageMatch[1])
      : 24,
  };
}

module.exports = {
  calculateVoltageDrop,
  parseVoltageDropRequest,
  COPPER_OHMS_PER_1000_FT,
};
