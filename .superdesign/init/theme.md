# Theme Tokens

## Compact Summary

**Font:** Inter (400–800), system-ui fallback

**Colors:**
- navy-950: #0a1f3d | navy-900: #102c53 | navy-800: #1a3a6b
- brand-green: #18b868 | brand-green-hover: #149858 | brand-green-light: #e6f9ef
- brand-blue: #3b82f6 | brand-blue-hover: #2563eb | brand-blue-light: #eff6ff
- surface: #ffffff | surface-muted: #f8fafc | surface-subtle: #f1f5f9 | page: #f0f4f8
- text: #0f172a | text-secondary: #64748b | text-muted: #94a3b8 | text-on-dark: #cbd5e1
- border: #e2e8f0 | border-light: #f1f5f9
- success: #18b868 | warning: #f59e0b | error: #ef4444 | info: #3b82f6

**Radius:** sm 0.5rem | md 0.75rem | lg 1rem | xl 1.25rem | 2xl 1.5rem | 3xl 2rem

**Shadows:**
- card: 0 1px 2px rgb(15 23 42 / 0.04), 0 8px 24px rgb(15 23 42 / 0.06)
- elevated: 0 4px 12px rgb(15 23 42 / 0.06), 0 24px 48px rgb(15 23 42 / 0.1)
- nav: 0 -4px 24px rgb(15 23 42 / 0.06)

**CSS utility classes:** .card, .btn-primary, .btn-coach, .btn-secondary, .btn-ghost, .input, .badge-*, .parent-scroll, .gradient-hero, .gradient-coach-sidebar

---

## Raw Source — seishin-app/src/index.css

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");
@import "tailwindcss";

@theme {
  --font-sans: "Inter", system-ui, sans-serif;
  --color-navy-950: #0a1f3d;
  --color-navy-900: #102c53;
  --color-brand-green: #18b868;
  --color-brand-green-light: #e6f9ef;
  --color-brand-blue: #3b82f6;
  --color-brand-blue-light: #eff6ff;
  --color-surface: #ffffff;
  --color-surface-muted: #f8fafc;
  --color-page: #f0f4f8;
  --color-text: #0f172a;
  --color-text-secondary: #64748b;
  --color-text-muted: #94a3b8;
  --color-warning: #f59e0b;
  --color-warning-bg: #fffbeb;
  --shadow-card: 0 1px 2px rgb(15 23 42 / 0.04), 0 8px 24px rgb(15 23 42 / 0.06);
  --shadow-elevated: 0 4px 12px rgb(15 23 42 / 0.06), 0 24px 48px rgb(15 23 42 / 0.1);
  --shadow-nav: 0 -4px 24px rgb(15 23 42 / 0.06);
}

.card { @apply rounded-2xl border border-border-light bg-surface shadow-[var(--shadow-card)]; }
.btn-primary { @apply rounded-xl bg-brand-green text-white font-semibold; }
.parent-scroll { @apply flex flex-1 flex-col gap-4 overflow-y-auto px-5 pb-6 pt-5; }
.gradient-hero { background: linear-gradient(135deg, var(--color-navy-950) 0%, var(--color-navy-900) 50%, #1e4a7a 100%); }
```
