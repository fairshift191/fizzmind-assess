// Fizzmind Assess — the design tokens.
//
// This app is styled with inline objects rather than a stylesheet, so the
// tokens live here. Same rule as anywhere else: if a colour or a size has a
// name, use the name. A value written in forty places is forty opinions that
// happen to agree today.
//
// The world: a dark field with a single gold accent. It is a quiet room with
// one light on, because the person on the other side is being interviewed and
// nothing on screen should compete with the conversation.

export const C = {
  // ── The field ──────────────────────────────────────────────────────────
  ink:        '#06060B',   // the deepest ground
  ground:     '#0A0B0F',   // page background
  panel:      '#1A1D26',   // cards and raised surfaces
  panelHi:    '#1E2130',   // a panel one step lighter
  line:       '#2A2D36',   // borders and rules

  // ── Ink on the field ───────────────────────────────────────────────────
  text:       '#E8E8ED',
  white:      '#FFFFFF',

  // ── The accent. One gold, used deliberately. ───────────────────────────
  gold:       '#C9963A',
  goldSoft:   '#D4A853',   // the lighter gold, for large fills

  // ── Semantic. These say what happened, not what track you are on. ──────
  danger:     '#EF4444',
  success:    '#10B981',
  warning:    '#F59E0B',

  // ── Per-track accents. Each assessment carries its own. ────────────────
  trackCode:  '#3B82F6',
  trackArts:  '#EC4899',
};

// Type ramp. Eight steps, closed.
export const T = {
  xs: '11px', sm: '12px', base: '13px', md: '14px',
  lg: '15px', xl: '16px', h2: '18px', h1: '24px',
};
