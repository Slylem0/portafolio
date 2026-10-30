export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Hyprland-style dwindle layout. Window 0 takes the whole (inset) area; each
 * following window splits the rect held by the previous one along its longer
 * side. The previous window keeps the first half (left/top).
 */
export function dwindle(count: number, area: Rect, gap: number): Rect[] {
  if (count <= 0) return [];
  const g = Math.max(0, gap);
  let cur: Rect = {
    x: area.x + g,
    y: area.y + g,
    w: Math.max(0, area.w - 2 * g),
    h: Math.max(0, area.h - 2 * g),
  };
  const out: Rect[] = [cur];
  for (let i = 1; i < count; i++) {
    const prev = out[i - 1];
    let first: Rect;
    let second: Rect;
    if (prev.w >= prev.h) {
      const hw = Math.max(0, (prev.w - g) / 2);
      first = { ...prev, w: hw };
      second = { x: prev.x + hw + g, y: prev.y, w: hw, h: prev.h };
    } else {
      const hh = Math.max(0, (prev.h - g) / 2);
      first = { ...prev, h: hh };
      second = { x: prev.x, y: prev.y + hh + g, w: prev.w, h: hh };
    }
    out[i - 1] = first;
    out.push(second);
  }
  return out;
}
