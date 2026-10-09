// ─── Brand color tokens ────────────────────────────────────────────────────────
export const T = {
  teal:      "#2a9d8f",
  tealDark:  "#1a7a6e",
  tealLight: "#e0f5f2",
  tealMid:   "#b2e4de",
  ink:       "#0d1f1e",
  inkSoft:   "#142321",
  text:      "#0a0a0a",
  muted:     "#607070",
  subtle:    "#9ab0ae",
  border:    "rgba(42,157,143,0.13)",
  surface:   "#f7fafa",
  white:     "#ffffff",
} as const;

// ─── Gradient utility (Tailwind class string) ─────────────────────────────────
// Usage: className={GRADIENT}
export const GRADIENT =
  "bg-gradient-to-t from-blue-300 via-slate-300 to-blue-600";
  