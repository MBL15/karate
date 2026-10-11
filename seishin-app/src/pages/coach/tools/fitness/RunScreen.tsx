import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Confetti, SuccessCheck } from '../../../../components/ui/Confetti'
import { IconX } from '../../../../components/ui/Icons'
import { beep, finishSignal, startSignal, unlockAudio, vibrate } from '../../../../utils/sound'
import { CATEGORIES } from './exercises'
import { sideLabel, type Workout } from './generator'
import { clock, plural } from './format'
import { Pictogram } from './Pictogram'

type Step =
  | { type: 'ready'; seconds: number }
  | { type: 'work'; item: number; set: number }
  | { type: 'rest'; seconds: number; nextLabel: string }
  | { type: 'finisher'; seconds: number }

function buildSteps(workout: Workout): Step[] {
  const steps: Step[] = [{ type: 'ready', seconds: 5 }]
  workout.items.forEach((item, i) => {
    for (let set = 1; set <= item.sets; set++) {
      steps.push({ type: 'work', item: i, set })
      const lastSet = set === item.sets
      const next = lastSet ? workout.items[i + 1] : item
      const nextLabel = next
        ? `${next.exercise.name}${next.sets > 1 ? ` · подход ${lastSet ? 1 : set + 1} из ${next.sets}` : ''}`
        : workout.finisher.name
      steps.push({ type: 'rest', seconds: item.rest, nextLabel })
    }
  })
  steps.push({ type: 'finisher', seconds: workout.finisher.seconds })
  return steps
}

function stepSeconds(step: Step, workout: Workout) {
  if (step.type === 'work') {
    const item = workout.items[step.item]
    return item.seconds != null ? item.seconds * (item.exercise.perSide ? 2 : 1) : null
  }
  return step.seconds
}

function Ring({ progress, color, children }: { progress: number; color: string; children: ReactNode }) {
  const r = 96
  const c = 2 * Math.PI * r
  return (
    <div className="relative mx-auto size-60">
      <svg viewBox="0 0 220 220" className="size-full" aria-hidden>
        <circle cx="110" cy="110" r={r} stroke="#eef2f7" strokeWidth="12" fill="none" />
        <circle
          cx="110"
          cy="110"
          r={r}
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(1, progress)))}
          transform="rotate(-90 110 110)"
          style={{ transition: 'stroke-dashoffset 0.25s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

export function RunScreen({ workout, onExit }: { workout: Workout; onExit: () => void }) {
  const steps = useMemo(() => buildSteps(workout), [workout])
  const [index, setIndex] = useState(0)
  const [endAt, setEndAt] = useState<number | null>(() => Date.now() + 5000)
  const [left, setLeft] = useState(5000)
  const [now, setNow] = useState(() => Date.now())
  const [done, setDone] = useState(false)
  const [startedAt] = useState(() => Date.now())
  const [finishedAt, setFinishedAt] = useState(0)
  const lastSecond = useRef<number | null>(null)

  const step = steps[index]
  const duration = stepSeconds(step, workout)
  const paused = endAt == null && duration != null && !done
  const remainingMs = endAt != null ? Math.max(0, endAt - now) : left

  const goTo = (next: number) => {
    lastSecond.current = null
    if (next >= steps.length) {
      setDone(true)
      setEndAt(null)
      setFinishedAt(Date.now())
      finishSignal()
      vibrate([200, 100, 200, 100, 400])
      return
    }
    const target = steps[next]
    const secs = stepSeconds(target, workout)
    setIndex(next)
    const t = Date.now()
    setNow(t)
    setEndAt(secs != null ? t + secs * 1000 : null)
    setLeft(secs != null ? secs * 1000 : 0)
    if (target.type === 'work' || target.type === 'finisher') {
      startSignal()
      vibrate(120)
    }
  }

  const goToRef = useRef(goTo)
  useEffect(() => {
    goToRef.current = goTo
  })

  useEffect(() => {
    unlockAudio()
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    if (endAt == null) return
    const id = window.setInterval(() => {
      const t = Date.now()
      setNow(t)
      const remaining = endAt - t
      const second = Math.ceil(remaining / 1000)
      if (second !== lastSecond.current) {
        lastSecond.current = second
        if (second > 0 && second <= 3) beep(880, 0.1)
      }
      if (remaining <= 0) goToRef.current(index + 1)
    }, 100)
    return () => window.clearInterval(id)
  }, [endAt, index])

  const togglePause = () => {
    if (endAt != null) {
      setLeft(Math.max(0, endAt - Date.now()))
      setEndAt(null)
    } else if (duration != null) {
      const t = Date.now()
      setNow(t)
      setEndAt(t + left)
    }
  }

  const addTime = (sec: number) => {
    if (endAt != null) setEndAt(endAt + sec * 1000)
    else setLeft((l) => l + sec * 1000)
  }

  const workSteps = steps.filter((s) => s.type === 'work').length
  const progress = done ? 1 : index / (steps.length - 1)

  const currentItemIndex = step.type === 'work' ? step.item : step.type === 'rest' ? (steps.slice(0, index).reverse().find((s) => s.type === 'work') as { item: number } | undefined)?.item ?? 0 : null
  const header =
    step.type === 'finisher' || done
      ? 'Финиш'
      : currentItemIndex != null
        ? `${String(currentItemIndex + 1).padStart(2, '0')} / ${String(workout.items.length).padStart(2, '0')}`
        : 'Старт'

  let body: ReactNode
  if (done) {
    const spent = Math.round((finishedAt - startedAt) / 1000)
    body = (
      <div className="flex flex-col items-center text-center">
        <Confetti />
        <SuccessCheck tone="coach" />
        <h2 className="mt-6 text-2xl font-bold text-text">Тренировка завершена!</h2>
        <p className="mt-1 text-sm text-text-secondary">«{workout.title}» пройден полностью</p>
        <div className="mt-6 grid w-full max-w-xs grid-cols-3 gap-2">
          {[
            [clock(spent), 'время'],
            [String(workout.items.length), plural(workout.items.length, 'упражнение', 'упражнения', 'упражнений')],
            [String(workSteps), plural(workSteps, 'подход', 'подхода', 'подходов')],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl bg-surface-muted px-2 py-3">
              <p className="text-lg font-bold text-text">{value}</p>
              <p className="text-[11px] text-text-secondary">{label}</p>
            </div>
          ))}
        </div>
        <button type="button" onClick={onExit} className="btn-coach mt-8 min-h-12 w-full max-w-xs rounded-2xl">
          Готово
        </button>
      </div>
    )
  } else if (step.type === 'ready') {
    body = (
      <div key={index} className="pop-in flex flex-col items-center text-center">
        <p className="text-sm font-bold tracking-[0.2em] text-brand-blue">ПРИГОТОВЬТЕСЬ</p>
        <p className="mt-6 text-[7rem] font-bold leading-none tabular-nums text-text">{Math.ceil(remainingMs / 1000)}</p>
        <p className="mt-6 text-sm text-text-secondary">Первое упражнение</p>
        <p className="text-lg font-semibold text-text">{workout.items[0]?.exercise.name}</p>
      </div>
    )
  } else if (step.type === 'rest') {
    body = (
      <div key={index} className="pop-in flex flex-col items-center text-center">
        <p className="text-sm font-bold tracking-[0.2em] text-brand-green">ОТДЫХ</p>
        <div className="mt-4">
          <Ring progress={duration ? remainingMs / (duration * 1000) : 0} color="#16a34a">
            <span className="text-5xl font-bold tabular-nums text-text">{clock(remainingMs / 1000)}</span>
          </Ring>
        </div>
        <p className="mt-6 text-sm text-text-secondary">Следующее:</p>
        <p className="text-lg font-semibold text-text">{step.nextLabel}</p>
      </div>
    )
  } else if (step.type === 'finisher') {
    body = (
      <div key={index} className="pop-in flex flex-col items-center text-center">
        <p className="text-sm font-bold tracking-[0.2em] text-[#7c3aed]">ЗАМИНКА</p>
        <div className="mt-4">
          <Ring progress={duration ? remainingMs / (duration * 1000) : 0} color="#7c3aed">
            <span className="text-5xl font-bold tabular-nums text-text">{clock(remainingMs / 1000)}</span>
          </Ring>
        </div>
        <p className="mt-6 text-lg font-semibold text-text">{workout.finisher.name}</p>
        <p className="mt-1 max-w-xs text-sm text-text-secondary">{workout.finisher.description}</p>
      </div>
    )
  } else {
    const item = workout.items[step.item]
    const meta = CATEGORIES[item.exercise.category]
    body = (
      <div key={index} className="pop-in flex flex-col items-center text-center">
        <Pictogram pose={item.exercise.pose} category={item.exercise.category} size={88} />
        <p className="mt-5 text-sm font-semibold" style={{ color: meta.color }}>
          Подход {step.set} из {item.sets}
        </p>
        <h2 className="mt-1 text-[1.75rem] font-bold uppercase leading-tight tracking-tight text-text">{item.exercise.name}</h2>
        {item.reps != null ? (
          <>
            <p className="mt-6 text-[5.5rem] font-bold leading-none tabular-nums text-text">{String(item.reps).padStart(2, '0')}</p>
            <p className="mt-2 text-base text-text-secondary">
              {item.exercise.perSide ? sideLabel(item.exercise) : plural(item.reps, 'повторение', 'повторения', 'повторений')}
            </p>
          </>
        ) : (
          <div className="mt-5">
            <Ring progress={duration ? remainingMs / (duration * 1000) : 0} color={meta.color}>
              <span className="text-5xl font-bold tabular-nums text-text">{clock(remainingMs / 1000)}</span>
              {item.exercise.perSide && <span className="mt-1 text-xs text-text-secondary">смена стороны на середине</span>}
            </Ring>
          </div>
        )}
        <p className="mt-4 max-w-xs text-sm text-text-secondary">{item.exercise.description}</p>
      </div>
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col bg-white" role="dialog" aria-modal="true" aria-label="Тренировка">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold tabular-nums text-text">{header}</span>
          <span className="text-xs font-medium text-text-secondary">{workout.title}</span>
          <button type="button" onClick={onExit} aria-label="Завершить тренировку" className="flex size-10 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
            <IconX size={18} />
          </button>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted">
          <span className="block h-full rounded-full bg-brand-blue transition-[width] duration-500" style={{ width: `${progress * 100}%` }} />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center py-6">{body}</div>

        {!done && (
          <div className="flex items-center justify-center gap-3">
            {step.type === 'work' && workout.items[step.item].reps != null ? (
              <button type="button" onClick={() => goTo(index + 1)} className="flex min-h-14 flex-1 items-center justify-center rounded-2xl bg-brand-blue text-base font-semibold text-white shadow-[var(--shadow-blue)] active:scale-[0.99]">
                Готово — дальше
              </button>
            ) : (
              <>
                {step.type === 'rest' && (
                  <button type="button" onClick={() => addTime(10)} className="btn-secondary min-h-14 shrink-0 rounded-2xl px-4">
                    +10 с
                  </button>
                )}
                <button type="button" onClick={togglePause} className="btn-secondary min-h-14 flex-1 rounded-2xl">
                  {paused ? 'Продолжить' : 'Пауза'}
                </button>
                <button type="button" onClick={() => goTo(index + 1)} className="flex min-h-14 flex-1 items-center justify-center rounded-2xl bg-brand-blue px-3 font-semibold text-white shadow-[var(--shadow-blue)] active:scale-[0.99]">
                  {step.type === 'rest' || step.type === 'ready' ? 'Пропустить' : 'Дальше'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
