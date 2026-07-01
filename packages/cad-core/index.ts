export function feetToInches(feet: number) {
  return feet * 12;
}

export function inchesToFeet(inches: number) {
  return inches / 12;
}

export function formatFeetInches(feet: number) {
  const wholeFeet = Math.floor(feet);
  const inches = Math.round((feet - wholeFeet) * 12);
  return `${wholeFeet}'-${inches}"`;
}

export function parseFeetInches(value: string) {
  const text = value.trim();
  const match = text.match(/^(\d+(?:\.\d+)?)'\s*-?\s*(\d+(?:\.\d+)?)?"?$/);

  if (match) {
    return Number(match[1]) + Number(match[2] || 0) / 12;
  }

  if (text.endsWith("in")) {
    return Number(text.replace("in", "")) / 12;
  }

  return Number(text);
}
