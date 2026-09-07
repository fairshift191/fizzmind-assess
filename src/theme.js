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

  // ── Disabled. A state, not a colour anyone chose. ──────────────────────
  mute:       '#444444',   // a control that cannot be used yet
  muteText:   '#666666',   // its label

  // ── Per-track accents. Each assessment carries its own. ────────────────
  trackCode:  '#3B82F6',
  trackArts:  '#EC4899',
};

// Type ramp. Twelve steps, closed. Interface at the small end, display at the
// large end, and nothing between that somebody nudged by eye.
export const T = {
  xs:   '11px',  // labels, meta
  sm:   '12px',  // captions
  base: '13px',  // secondary body
  md:   '14px',  // default interface text
  lg:   '15px',  // lead copy
  xl:   '16px',  // section intros
  h3:   '18px',  // card headings
  h2:   '24px',  // screen titles
  h1:   '28px',  // display
  d1:   '32px',  // display, large
  d2:   '48px',  // hero
  d3:   '56px',  // hero, largest
};


// ── Veils ───────────────────────────────────────────────────────────────────
// White and black at fixed strengths, for text tiers and scrims on the dark
// field. A closed ramp, because the alternative is what we had: forty two
// different strengths of white, most of them used once.
export const W = {
  4:  'rgba(255,255,255,0.04)',
  8:  'rgba(255,255,255,0.08)',
  15: 'rgba(255,255,255,0.15)',
  25: 'rgba(255,255,255,0.25)',
  35: 'rgba(255,255,255,0.35)',
  45: 'rgba(255,255,255,0.45)',
  60: 'rgba(255,255,255,0.60)',
  75: 'rgba(255,255,255,0.75)',
};

export const K = {
  20: 'rgba(0,0,0,0.20)',
  30: 'rgba(0,0,0,0.30)',
  50: 'rgba(0,0,0,0.50)',
  70: 'rgba(0,0,0,0.70)',
};

// A tint of any token colour, derived rather than written out, so changing a
// token changes every tint of it.
export const tint = (c, pct) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;
