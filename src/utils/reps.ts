/** Pick the top end of a programmed rep range for the initial set target. */
export function getInitialReps(value: unknown): number {
  const text = String(value ?? "");
  const range = text.match(/(\d+(?:[.,]\d+)?)\s*(?:-|–|—|à|a|to)\s*(\d+(?:[.,]\d+)?)/i);
  if (range) return Number(range[2].replace(",", "."));

  const multiplier = text.match(/\d+\s*[x×]\s*(\d+(?:[.,]\d+)?)/i);
  const number = multiplier?.[1] ?? text.match(/\d+(?:[.,]\d+)?/)?.[0] ?? "0";
  return Number(number.replace(",", "."));
}
