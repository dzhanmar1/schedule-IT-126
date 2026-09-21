// Utility to generate a consistent pastel color from a string
export function stringToColor(str: string): string {
  if (!str) return 'var(--color-primary-500)';

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use HSL for bright, pastel-like colors
  const h = hash % 360;
  const s = 65 + (hash % 15); // 65-80% saturation
  const l = 55 + (hash % 10); // 55-65% lightness

  return `hsl(${h}, ${s}%, ${l}%)`;
}
