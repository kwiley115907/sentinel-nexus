export const GRID_UNIT_FEET = 1;
export const INCHES_PER_FOOT = 12;

export function feetToInches(feet: number) {
  return feet * INCHES_PER_FOOT;
}

export function inchesToFeet(inches: number) {
  return inches / INCHES_PER_FOOT;
}

export function formatFeet(feet: number) {
  return `${feet.toFixed(1)} ft`;
}

export function formatFeetInches(feet: number) {
  const wholeFeet = Math.floor(feet);
  const inches = Math.round((feet - wholeFeet) * INCHES_PER_FOOT);

  if (inches === 12) {
    return `${wholeFeet + 1}'-0"`;
  }

  return `${wholeFeet}'-${inches}"`;
}

export function parseFeetInches(value: string) {
  const cleaned = value.trim();

  if (!cleaned) return 0;

  const feetInchesMatch = cleaned.match(/^(\d+(?:\.\d+)?)'\s*-?\s*(\d+(?:\.\d+)?)?"?$/);

  if (feetInchesMatch) {
    const feet = Number(feetInchesMatch[1] || 0);
    const inches = Number(feetInchesMatch[2] || 0);
    return feet + inches / 12;
  }

  const inchesMatch = cleaned.match(/^(\d+(?:\.\d+)?)\s*(in|inch|inches|")$/i);

  if (inchesMatch) {
    return Number(inchesMatch[1]) / 12;
  }

  return Number(cleaned);
}
