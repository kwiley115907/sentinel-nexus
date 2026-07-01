export function estimateFireAlarmDevices(areaSqFt: number) {
  return {
    smokeDetectors: Math.ceil(areaSqFt / 900),
    hornStrobes: Math.ceil(areaSqFt / 2500),
    pullStations: Math.max(1, Math.ceil(areaSqFt / 10000)),
  };
}
