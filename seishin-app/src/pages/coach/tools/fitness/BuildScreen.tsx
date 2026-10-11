import { useState } from 'react'
import { IconCheck } from '../../../../components/ui/Icons'
import { DAY_COMPLEX } from './dayComplex'
import { CATEGORIES, EXERCISES, type Category } from './exercises'
import type { Minutes } from './generator'
import { plural } from './format'
import { CategoryArt, Pictogram } from './Pictogram'

const MINUTES: Minutes[] = [5, 10, 15]

function DayCard({ onTry }: { onTry: () => void }) {
  const { author, workout } = DAY_COMPLEX
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] p-5 text-white shadow-[var(--shadow-blue)]">
      <span className="pointer-events-none absolute -top-12 -right-10 size-40 rounded-full bg-white/10" aria-hidden />
      <span className="pointer-events-none absolute -bottom-16 left-16 size-32 rounded-full bg-white/5" aria-hidden />
      <span className="relative inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold tracking-[0.12em]">
        КОМПЛЕКС ДНЯ
      </span>
      <div className="relative mt-4 flex items-center gap-3.5">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4ade80] to-[#16a34a] text-lg font-bold ring-4 ring-white/20">
          {author.initials}
        </span>
        <div className="min-w-0">
          <p className="text-xs text-white/75">Комплекс от спортсмена</p>
          <p className="font-semibold">{author.name}</p>
        </div>
      </div>
      <p className="relative mt-4 text-2xl font-bold tracking-tight">«{workout.title}»</p>
      <div className="relative mt-4 flex items-center justify-between gap-3">
        <span className="flex min-w-0 flex-wrap gap-1.5">
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold">{workout.minutes} минут</span>
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold">
            {workout.items.length} {plural(workout.items.length, 'упражнение', 'упражнения', 'упражнений')}
          </span>
        </span>
        <button
          type="button"
          onClick={onTry}
          className="min-h-10 shrink-0 rounded-full bg-white px-5 text-sm font-semibold text-brand-blue transition hover:scale-105 active:scale-95"
        >
          Смотреть
        </button>
      </div>
    </section>
  )
}

function StepTitle({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="mb-3">
      <h3 className="flex items-center gap-2 text-base font-bold text-text">
        <span className="flex size-6 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white">{n}</span>
        {title}
      </h3>
      {hint && <p className="mt-1 pl-8 text-xs text-text-secondary">{hint}</p>}
    </div>
  )
}

export function BuildScreen({
  categories,
  selected,
  minutes,
  error,
  onToggleCategory,
  onToggleExercise,
  onSelectAll,
  onMinutes,
  onGenerate,
  onTryDay,
  onRandomize,
}: {
  categories: Category[]
  selected: string[]
  minutes: Minutes
  error: string | null
  onToggleCategory: (c: Category) => void
  onToggleExercise: (id: string) => void
  onSelectAll: (c: Category) => void
  onMinutes: (m: Minutes) => void
  onGenerate: () => void
  onTryDay: () => void
  onRandomize: () => void
}) {
  const count = selected.length
  const [rolls, setRolls] = useState(0)

  return (
    <>
      <DayCard onTry={onTryDay} />

      <div className="pt-2">
        <h2 className="text-[1.4rem] font-bold tracking-tight text-text">Собери тренировку</h2>
        <p className="mt-1 text-sm text-text-secondary">Выбери, что хочешь проработать, упражнения и время — остальное сделаем сами.</p>
      </div>

      <section>
        <StepTitle n={1} title="Что прорабатываем?" hint="Можно выбрать несколько" />
        <div className="grid grid-cols-3 gap-2.5">
          {(Object.keys(CATEGORIES) as Category[]).map((c) => {
            const active = categories.includes(c)
            const meta = CATEGORIES[c]
            return (
              <button
                key={c}
                type="button"
                onClick={() => onToggleCategory(c)}
                aria-pressed={active}
                className={`tool-tile relative flex flex-col items-center rounded-3xl border-2 bg-white px-2 pt-4 pb-3.5 shadow-[var(--shadow-card)] ${
                  active ? '' : 'border-transparent'
                }`}
                style={active ? { borderColor: meta.color, backgroundColor: meta.soft } : undefined}
              >
                <CategoryArt category={c} size={56} />
                <span className="mt-2.5 text-base font-bold text-text">{meta.label}</span>
                <span className="mt-0.5 text-center text-[11px] leading-tight text-text-secondary">{meta.hint}</span>
                {active && (
                  <span className="pop-in absolute top-2 right-2 flex size-6 items-center justify-center rounded-full text-white" style={{ backgroundColor: meta.color }}>
                    <IconCheck size={13} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="pop-in">
          <StepTitle n={2} title="Какие упражнения хочешь видеть?" hint="Это пожелания — порядок, подходы и время подберём сами" />
          <button
            type="button"
            onClick={() => {
              setRolls((r) => r + 1)
              onRandomize()
            }}
            className="tool-tile mb-5 flex w-full items-center gap-3.5 rounded-3xl border-2 border-dashed border-brand-blue/35 bg-brand-blue-light/60 p-3.5 text-left"
          >
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-[var(--shadow-blue)]"
              style={{ transform: `rotate(${rolls * 360}deg)`, transition: 'transform 600ms var(--ease-out-expo)' }}
              aria-hidden
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <rect x="3.5" y="3.5" width="17" height="17" rx="4" stroke="currentColor" strokeWidth="2" />
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" />
                <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-text">{rolls ? 'Подобрать другие' : 'Подобрать случайно'}</span>
              <span className="mt-0.5 block text-xs leading-snug text-text-secondary">
                {rolls ? 'Не нравится набор? Нажми ещё раз' : 'Не хочешь читать список — выберем упражнения за тебя'}
              </span>
            </span>
          </button>
          <div className="space-y-5">
            {categories.map((c) => {
              const meta = CATEGORIES[c]
              const list = EXERCISES.filter((e) => e.category === c)
              const all = list.every((e) => selected.includes(e.id))
              return (
                <div key={c}>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="flex items-center gap-2 text-sm font-semibold text-text">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: meta.color }} aria-hidden />
                      {meta.label}
                    </p>
                    <button type="button" onClick={() => onSelectAll(c)} className="text-xs font-semibold text-brand-blue">
                      {all ? 'Снять все' : 'Выбрать все'}
                    </button>
                  </div>
                  <ul className="tool-stagger grid gap-2 sm:grid-cols-2">
                    {list.map((e) => {
                      const active = selected.includes(e.id)
                      return (
                        <li key={e.id}>
                          <button
                            type="button"
                            onClick={() => onToggleExercise(e.id)}
                            aria-pressed={active}
                            className="flex w-full items-center gap-3 rounded-2xl border-2 bg-white p-2.5 text-left transition duration-200 active:scale-[0.98]"
                            style={{ borderColor: active ? meta.color : 'transparent', boxShadow: active ? 'none' : 'var(--shadow-card)' }}
                          >
                            <Pictogram pose={e.pose} category={c} size={48} />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold leading-snug text-text">{e.name}</span>
                              <span className="mt-0.5 block text-xs leading-snug text-text-secondary">{e.description}</span>
                            </span>
                            <span
                              className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-white transition"
                              style={active ? { backgroundColor: meta.color, borderColor: meta.color } : { borderColor: '#dbe1ea' }}
                            >
                              {active && <IconCheck size={12} />}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section>
        <StepTitle n={categories.length ? 3 : 2} title="Сколько времени?" />
        <div className="grid grid-cols-3 gap-2.5">
          {MINUTES.map((m) => {
            const active = minutes === m
            return (
              <button
                key={m}
                type="button"
                onClick={() => onMinutes(m)}
                aria-pressed={active}
                className={`tool-tile rounded-3xl py-4 text-center ${
                  active ? 'bg-brand-blue text-white shadow-[var(--shadow-blue)]' : 'border border-border-light bg-white text-text shadow-[var(--shadow-card)]'
                }`}
              >
                <span className="block text-3xl font-bold leading-none tabular-nums">{m}</span>
                <span className={`mt-1 block text-xs font-medium ${active ? 'text-white/80' : 'text-text-secondary'}`}>минут</span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="pt-2">
        {error && (
          <p
            role="alert"
            ref={(el) => el?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="pop-in mb-3 rounded-2xl bg-error-bg px-4 py-3 text-sm font-medium text-error">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={onGenerate}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand-blue text-base font-semibold text-white shadow-[var(--shadow-blue)] transition hover:brightness-110 active:scale-[0.99]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2Zm7 12 .9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14Z" />
          </svg>
          Сгенерировать комплекс
        </button>
        <p className="mt-2 text-center text-xs text-text-muted">
          {count ? `${count} ${plural(count, 'упражнение', 'упражнения', 'упражнений')} · ${minutes} минут` : 'Выберите группу мышц и упражнения'}
        </p>
      </div>
    </>
  )
}
