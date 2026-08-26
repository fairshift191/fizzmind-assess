# Fizzmind Assess — Design System

## The world: a quiet room with one light on

This app runs a voice conversation between a student and Coach Nova. The person
on the other side is being interviewed, sometimes about work they are nervous
about. Nothing on screen should compete with that.

So: a dark field, a single gold accent, and almost nothing else. The interface
recedes and the conversation is the product.

**This is Fizzmind, not Fairshift.** Separate business, separate audience,
separate sending domain. Never borrow Fairshift's palette, copy or credentials.

## Colour

All tokens live in `src/theme.js`. The app is styled with inline objects rather
than a stylesheet, so the tokens are a JS export. There are no literal hex
values left in `src/screens` or `src/components`.

### The field

| Token | Value | Use |
|---|---|---|
| `C.ink` | `#06060B` | The deepest ground |
| `C.ground` | `#0A0B0F` | Page background |
| `C.panel` | `#1A1D26` | Cards and raised surfaces |
| `C.panelHi` | `#1E2130` | A panel one step lighter |
| `C.line` | `#2A2D36` | Borders and rules |
| `C.text` | `#E8E8ED` | Ink on the field |

### The accent

| Token | Value | Use |
|---|---|---|
| `C.gold` | `#C9963A` | **The** accent. Actions, emphasis, the Nova mark |
| `C.goldSoft` | `#D4A853` | The lighter gold, for large fills |

One accent, used deliberately. Forty-seven of the app's colour uses are this
gold; that concentration is the identity, not an accident.

### Semantic

These say what happened. They are never decoration.

| Token | Value | Use |
|---|---|---|
| `C.danger` | `#EF4444` | Errors, disconnection, destructive actions |
| `C.success` | `#10B981` | Completion, a correct answer |
| `C.warning` | `#F59E0B` | Reconnecting, time running out |

### Disabled

A state, not a colour anyone chose. Named because four different greys were
doing this job before anyone noticed it was one job.

| Token | Value | Use |
|---|---|---|
| `C.mute` | `#444444` | A control that cannot be used yet |
| `C.muteText` | `#666666` | Its label |

### Veils

White and black at fixed strengths, for text tiers and scrims on the dark field.

| Ramp | Steps |
|---|---|
| `W` (white) | 4, 8, 15, 25, 35, 45, 60, 75 |
| `K` (black) | 20, 30, 50, 70 |

A tint of any token colour is **derived**, never written out:

```js
background: tint(C.danger, 15)
```

### Per-track accents

Each assessment track carries its own colour, applied from the track, never
hand-picked per component.

| Token | Value | Track |
|---|---|---|
| `C.trackCode` | `#3B82F6` | Code and Python |
| `C.trackArts` | `#EC4899` | Arts |
| `C.gold` | `#C9963A` | Voice interviews with Coach Nova |

## Type

Eight steps, closed, in `T` from `src/theme.js`.

| Token | Size | Use |
|---|---|---|
| `T.xs` | 11px | Labels, meta |
| `T.sm` | 12px | Captions, rules under a heading |
| `T.base` | 13px | Secondary body |
| `T.md` | 14px | Default interface text |
| `T.lg` | 15px | Lead copy |
| `T.xl` | 16px | Section intros |
| `T.h2` | 18px | Card headings |
| `T.h1` | 24px | Screen titles |

## Rules

- **No new literal colours, in any form.** Not hex, not shorthand hex, not
  `rgba()`, not inside a longer string like `1px solid …`. If a value has a
  token, use the token.

- **Count every form, not the one you are picturing.** This is the rule that
  cost the most to learn. The first pass here found 128 six-digit hex values and
  declared the file clean. It was not: there were 83 `rgba()` values, 7
  shorthand hex, and more hidden inside composite strings, all of them the same
  problem wearing a different shape. A search finds the form you imagined and
  leaves you feeling thorough. Count `#abc`, `#aabbcc`, `rgba()`, and anything
  inside a string, separately, and add up the total before believing it.
- **Semantic colours never decorate.** Red means something went wrong. If it is
  there because it looked good, it is the wrong colour.
- **The gold is the only accent.** Track colours belong to the track, not to
  whichever component wanted a bit of colour.

## Honesty

The invite pages describe real calls with a real coach. They never invent a
session that did not happen or a result the student did not get.
