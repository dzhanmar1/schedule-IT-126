// Utility to generate a consistent pastel color from a string
export function stringToColor(str: string): string {
  if (!str) return 'var(--color-primary-500)';

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use HSL for vivid, slightly darker colors to contrast well with white text
  const h = Math.abs(hash) % 360;
  const s = 70 + (Math.abs(hash) % 20); // 70-90% saturation
  const l = 35 + (Math.abs(hash) % 15); // 35-50% lightness

  return `hsl(${h}, ${s}%, ${l}%)`;
}
