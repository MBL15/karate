import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ToolShell } from '../../../components/coach/tools/ToolShell'
import { beep, unlockAudio, vibrate } from '../../../utils/sound'

type Mode = 'timer' | 'stopwatch'

const PRESETS = [30, 60, 90, 120, 180, 300]
const BLUE = '#2563eb'
const AMBER = '#f59e0b'
const RED = '#ef4444'

const audio = unlockAudio

function formatClock(ms: number, withCentis = false) {
  const total = withCentis ? Math.floor(ms / 10) : Math.ceil(ms / 1000)
  const seconds = withCentis ? Math.floor(total / 100) : total
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  if (!withCentis) return `${mm}:${ss}`
  return `${mm}:${ss}.${String(total % 100).padStart(2, '0')}`
}

function presetLabel(seconds: number) {
  return seconds < 60 ? `${seconds} с` : seconds % 60 ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : `${seconds / 60} мин`
}

function Ring({
  progress,
  color,
  pulse,
  burst,
  children,
}: {
  progress: number
  color: string
  pulse?: boolean
  burst?: number
  children: ReactNode
}) {
  const size = 280
  const stroke = 14
  const r = (size - stroke) / 2 - 6
  const circumference = 2 * Math.PI * r
  const clamped = Math.min(1, Math.max(0, progress))
  const angle = clamped * 2 * Math.PI - Math.PI / 2
  const knobX = size / 2 + r * Math.cos(angle)
  const knobY = size / 2 + r * Math.sin(angle)

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[17.5rem]">
      {burst ? (
        <span
          key={burst}
          className="timer-burst absolute inset-0 rounded-full border-[6px]"
          style={{ borderColor: color }}
          aria-hidden
        />
      ) : null}
      <svg viewBox={`0 0 ${size} ${size}`} className={`size-full ${pulse ? 'timer-pulse' : ''}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r + 18} fill="#fff" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#eef2f7" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="timer-ring"
          style={{ filter: `drop-shadow(0 4px 10px ${color}55)` }}
        />
        {clamped > 0.002 && (
          <circle cx={knobX} cy={knobY} r={9} fill="#fff" stroke={color} strokeWidth={4} className="timer-ring" />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

function RoundButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex size-14 items-center justify-center rounded-full border border-border-light bg-white text-sm font-semibold text-text-secondary shadow-[var(--shadow-card)] transition hover:text-text active:scale-95 disabled:opacity-40"
      aria-label={label}
    >
      {children}
    </button>
  )
}

function PlayButton({ running, onClick, color }: { running: boolean; onClick: () => void; color: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={running ? 'Пауза' : 'Старт'}
      className="flex size-20 items-center justify-center rounded-full text-white transition-[transform,background-color] duration-300 hover:scale-105 active:scale-95"
      style={{ backgroundColor: color, boxShadow: `0 12px 28px ${color}55` }}
    >
      {running ? (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <rect x="6" y="5" width="4" height="14" rx="1.5" />
          <rect x="14" y="5" width="4" height="14" rx="1.5" />
        </svg>
      ) : (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
        </svg>
      )}
    </button>
  )
}

function SoundToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <RoundButton label={on ? 'Выключить звук' : 'Включить звук'} onClick={onToggle}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        {on ? (
          <>
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </>
        ) : (
          <path d="m16 9 5 6m0-6-5 6" />
        )}
      </svg>
    </RoundButton>
  )
}

function CountdownTimer({ sound, onToggleSound }: { sound: boolean; onToggleSound: () => void }) {
  const [duration, setDuration] = useState(60_000)
  const [left, setLeft] = useState(60_000)
  const [endAt, setEndAt] = useState<number | null>(null)
  const [now, setNow] = useState(0)
  const [finished, setFinished] = useState(0)
  const soundRef = useRef(sound)
  const lastSecond = useRef<number | null>(null)

  useEffect(() => {
    soundRef.current = sound
  }, [sound])

  useEffect(() => {
    if (endAt == null) return
    let frame = 0
    const loop = () => {
      const t = performance.now()
      const remaining = Math.max(0, endAt - t)
      setNow(t)
      const second = Math.ceil(remaining / 1000)
      if (second !== lastSecond.current) {
        lastSecond.current = second
        if (second > 0 && second <= 3) {
          if (soundRef.current) beep(880, 0.12)
          vibrate(40)
        }
      }
      if (remaining <= 0) {
        setEndAt(null)
        setLeft(0)
        setFinished(Date.now())
        if (soundRef.current) {
          beep(1046, 0.22)
          beep(1046, 0.22, 0.28)
          beep(1318, 0.6, 0.56)
        }
        vibrate([200, 100, 200, 100, 400])
        return
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [endAt])

  const running = endAt != null
  const remaining = running ? Math.max(0, endAt - now) : left
  const progress = duration ? remaining / duration : 0
  const idle = !running && left === duration
  const done = !running && left === 0
  const color = remaining <= 10_000 && !idle ? (remaining <= 5_000 ? RED : AMBER) : BLUE

  const toggle = () => {
    audio()
    if (running) {
      setLeft(Math.max(0, endAt - performance.now()))
      setEndAt(null)
      return
    }
    const start = done ? duration : left
    lastSecond.current = null
    setFinished(0)
    setLeft(start)
    const t = performance.now()
    setNow(t)
    setEndAt(t + start)
  }

  const reset = () => {
    setEndAt(null)
    setLeft(duration)
    setFinished(0)
  }

  const pick = (ms: number) => {
    const next = Math.min(99 * 60_000, Math.max(5_000, ms))
    setDuration(next)
    setLeft(next)
    setFinished(0)
  }

  return (
    <>
      <div className={finished ? 'timer-done' : ''}>
        <Ring progress={progress} color={done ? RED : color} pulse={running && remaining <= 10_000} burst={finished}>
          <p
            className="font-display text-[3.4rem] font-bold leading-none tracking-tight tabular-nums text-text"
            aria-live={done ? 'assertive' : 'off'}
          >
            {formatClock(remaining)}
          </p>
          <p className="mt-2 text-sm font-medium" style={{ color: done ? RED : '#64748b' }}>
            {done ? 'Время вышло!' : running ? 'Идёт отсчёт' : idle ? `из ${formatClock(duration)}` : 'Пауза'}
          </p>
        </Ring>
      </div>

      <div className="mt-6 flex items-center justify-center gap-5">
        <RoundButton label="Сбросить" onClick={reset} disabled={idle}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </RoundButton>
        <PlayButton running={running} onClick={toggle} color={done ? RED : color} />
        <SoundToggle on={sound} onToggle={onToggleSound} />
      </div>

      <div className={`mt-7 transition-opacity duration-300 ${running ? 'pointer-events-none opacity-40' : ''}`}>
        <div className="flex items-center justify-center gap-2">
          <button type="button" onClick={() => pick(duration - 15_000)} className="min-h-10 rounded-full bg-surface-muted px-4 text-sm font-semibold text-text-secondary transition active:scale-95">
            −15 с
          </button>
          <span className="min-w-20 text-center text-sm font-semibold text-text tabular-nums">{formatClock(duration)}</span>
          <button type="button" onClick={() => pick(duration + 15_000)} className="min-h-10 rounded-full bg-surface-muted px-4 text-sm font-semibold text-text-secondary transition active:scale-95">
            +15 с
          </button>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {PRESETS.map((seconds) => {
            const active = duration === seconds * 1000
            return (
              <button
                key={seconds}
                type="button"
                onClick={() => pick(seconds * 1000)}
                className={`min-h-10 rounded-full px-4 text-sm font-semibold transition active:scale-95 ${
                  active ? 'bg-brand-blue text-white shadow-[var(--shadow-blue)]' : 'border border-border-light bg-white text-text-secondary'
                }`}
              >
                {presetLabel(seconds)}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

function Stopwatch({ sound, onToggleSound }: { sound: boolean; onToggleSound: () => void }) {
  const [startAt, setStartAt] = useState<number | null>(null)
  const [acc, setAcc] = useState(0)
  const [now, setNow] = useState(0)
  const [laps, setLaps] = useState<number[]>([])

  useEffect(() => {
    if (startAt == null) return
    let frame = 0
    const loop = () => {
      setNow(performance.now())
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [startAt])

  const running = startAt != null
  const elapsed = acc + (running ? Math.max(0, now - startAt) : 0)

  const toggle = () => {
    if (sound) beep(660, 0.08)
    if (running) {
      setAcc(acc + performance.now() - startAt)
      setStartAt(null)
    } else {
      const t = performance.now()
      setNow(t)
      setStartAt(t)
    }
  }

  const lapOrReset = () => {
    if (running) {
      if (sound) beep(990, 0.06)
      vibrate(25)
      setLaps((list) => [elapsed, ...list])
    } else {
      setAcc(0)
      setLaps([])
    }
  }

  const splits = laps.map((total, index) => total - (laps[index + 1] ?? 0))
  const best = splits.length > 1 ? Math.min(...splits) : null
  const worst = splits.length > 1 ? Math.max(...splits) : null

  return (
    <>
      <Ring progress={(elapsed % 60_000) / 60_000} color={BLUE}>
        <p className="font-display text-[2.9rem] font-bold leading-none tracking-tight tabular-nums text-text">
          {formatClock(elapsed, true)}
        </p>
        <p className="mt-2 text-sm font-medium text-text-secondary">
          {running ? 'Идёт замер' : elapsed ? 'Пауза' : 'Готов к старту'}
        </p>
      </Ring>

      <div className="mt-6 flex items-center justify-center gap-5">
        <RoundButton label={running ? 'Круг' : 'Сбросить'} onClick={lapOrReset} disabled={!running && elapsed === 0}>
          {running ? 'Круг' : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          )}
        </RoundButton>
        <PlayButton running={running} onClick={toggle} color={BLUE} />
        <SoundToggle on={sound} onToggle={onToggleSound} />
      </div>

      {laps.length > 0 && (
        <ul className="mt-7 divide-y divide-border-light overflow-hidden rounded-3xl border border-border-light bg-white shadow-[var(--shadow-card)]">
          {splits.map((split, index) => {
            const tone = split === best ? 'text-brand-green' : split === worst ? 'text-[#ef4444]' : 'text-text'
            return (
              <li key={laps.length - index} className={`flex items-center justify-between px-5 py-3 text-sm ${index === 0 ? 'pop-in' : ''}`}>
                <span className="font-medium text-text-secondary">Круг {laps.length - index}</span>
                <span className={`font-semibold tabular-nums ${tone}`}>{formatClock(split, true)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

export function TimerTool() {
  const [mode, setMode] = useState<Mode>('timer')
  const [sound, setSound] = useState(true)

  return (
    <ToolShell kind="timer" title="Таймер" subtitle="Отсчёт времени и замеры">
      <div className="relative mx-auto grid max-w-xs grid-cols-2 rounded-full bg-surface-muted p-1">
        <span
          className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-[var(--shadow-card)] transition-transform duration-400 ease-[cubic-bezier(0.34,1.4,0.64,1)]"
          style={{ transform: mode === 'stopwatch' ? 'translateX(100%)' : 'translateX(0)' }}
          aria-hidden
        />
        {(['timer', 'stopwatch'] as Mode[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            aria-pressed={mode === item}
            className={`relative min-h-10 rounded-full text-sm font-semibold transition-colors ${
              mode === item ? 'text-text' : 'text-text-secondary'
            }`}
          >
            {item === 'timer' ? 'Таймер' : 'Секундомер'}
          </button>
        ))}
      </div>

      <div key={mode} className="pop-in pt-2">
        {mode === 'timer' ? (
          <CountdownTimer sound={sound} onToggleSound={() => setSound((v) => !v)} />
        ) : (
          <Stopwatch sound={sound} onToggleSound={() => setSound((v) => !v)} />
        )}
      </div>
    </ToolShell>
  )
}
