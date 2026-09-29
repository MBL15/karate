# SEISHIN Design System

## Product Context
SEISHIN is a digital platform for a karate club (Каратэ-клуб). Two primary audiences:
- **Parents** — mobile-first "Дневник родителя" (parent diary): child progress, belt advancement, payments, competition invites
- **Coaches** — desktop "Кабинет тренера" (coach dashboard): attendance, awards, payments, competition management

Language: Russian (ru). Tone: trustworthy, motivating, clean sports/education app — not gamified or childish.

## Brand Identity
- **Name:** SEISHIN (精神 — spirit/mind in Japanese)
- **Logo mark:** Kanji 空 in white on colored rounded square (green for parent, blue for coach/site)
- **Tagline:** Каратэ-клуб

## Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| navy-950 | #0a1f3d | Hero/footer dark backgrounds |
| navy-900 | #102c53 | Gradients, coach sidebar |
| brand-green | #18b868 | Parent primary, success, CTAs |
| brand-green-light | #e6f9ef | Parent accents, active states |
| brand-blue | #3b82f6 | Coach primary, links |
| brand-blue-light | #eff6ff | Coach accents |
| surface | #ffffff | Cards, nav |
| surface-muted | #f8fafc | Page backgrounds inside mobile frame |
| page | #f0f4f8 | App background |
| text | #0f172a | Primary text |
| text-secondary | #64748b | Secondary text |
| text-muted | #94a3b8 | Labels, nav inactive |
| warning | #f59e0b | Competition alerts |
| warning-bg | #fffbeb | Competition card bg accent |
| border | #e2e8f0 | Borders |
| border-light | #f1f5f9 | Subtle borders |

## Typography
- **Font:** Inter (400, 500, 600, 700, 800)
- **Page title:** text-xl font-bold (mobile), text-2xl/3xl (desktop)
- **Section label:** text-xs font-semibold uppercase tracking-wider
- **Body:** text-sm, leading-relaxed
- **Stat values:** text-2xl/3xl font-bold tracking-tight

## Spacing & Layout
- Mobile parent app: max-width 430px, phone-frame feel on desktop
- Card padding: p-5
- Section gaps: gap-4
- Border radius: rounded-xl (buttons), rounded-2xl (cards), rounded-3xl (phone frame)
- Bottom nav height: 72px

## Components
- **`.card`** — white bg, rounded-2xl, border border-light, shadow-card
- **`.btn-primary`** — green bg, white text, rounded-xl, font-semibold
- **`.btn-secondary`** — bordered white button
- **ProgressBar** — green fill on light green track, 2.5 height, rounded-full
- **ChildSwitcher** — horizontal pill buttons, active = green filled
- **ParentBottomNav** — 4 tabs with SVG icons (house, user, award, folder)

## Shadows
- shadow-card: subtle card elevation
- shadow-elevated: phone frame on desktop
- shadow-nav: bottom nav upward shadow

## Motion
- Buttons: active:scale-[0.98]
- Cards (marketing): hover:-translate-y-0.5
- Progress bar: transition-all duration-500

## Parent Home Screen (/app)
Key content blocks:
1. Header "Дневник" + child switcher pills
2. Child profile card: avatar, name, age, belt, progress bar to next belt
3. Recent payment card (optional)
4. Competition invite card with amber left border (optional)
5. Bottom navigation: Главная, Профиль, Награды, Архив
