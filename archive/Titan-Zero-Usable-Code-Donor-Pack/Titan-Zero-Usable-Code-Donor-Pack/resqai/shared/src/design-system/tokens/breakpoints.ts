export interface BreakpointTokens {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

export const breakpoints: BreakpointTokens = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export type BreakpointKey = keyof BreakpointTokens;

export function up(key: BreakpointKey): string {
  return `@media (min-width: ${breakpoints[key]}px)`;
}

export function down(key: BreakpointKey): string {
  return `@media (max-width: ${breakpoints[key] - 0.02}px)`;
}

export function between(keyMin: BreakpointKey, keyMax: BreakpointKey): string {
  return `@media (min-width: ${breakpoints[keyMin]}px) and (max-width: ${breakpoints[keyMax] - 0.02}px)`;
}

export function only(key: BreakpointKey): string {
  const keys: BreakpointKey[] = ['sm', 'md', 'lg', 'xl', '2xl'];
  const idx = keys.indexOf(key);
  if (idx === -1) return up(key);
  if (idx === keys.length - 1) return up(key);
  return between(key, keys[idx + 1]);
}
