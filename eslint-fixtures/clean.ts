export function pickWarmest(levels: number[]): number | null {
  if (levels.length === 0) {
    return null;
  }
  return Math.max(...levels);
}
