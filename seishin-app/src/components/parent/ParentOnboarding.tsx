import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi, type LinkedChild } from '../../api/auth'
import { parentApi } from '../../api/parent'
import { ApiError } from '../../api/client'
import { CodeBoxes, parentAccent } from '../auth/AuthWidgets'
import {
  IconArrowLeft,
  IconBell,
  IconChevronRight,
  IconHelpCircle,
  IconUser,
} from '../ui/Icons'
import { useAuth } from '../../context/AuthContext'
import { useParentChild } from '../../context/ParentChildContext'

type Screen = 'welcome' | 'code' | 'how' | 'support'

export function ParentOnboarding() {
  const { user } = useAuth()
  const { refresh, setSelectedChildId } = useParentChild()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [screen, setScreen] = useState<Screen>('welcome')
  const [code, setCode] = useState('')
  const [clubName, setClubName] = useState('')
  const [phase, setPhase] = useState<'code' | 'child'>('code')
  const [childFirstName, setChildFirstName] = useState('')
  const [childLastName, setChildLastName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [linked, setLinked] = useState<LinkedChild | null>(null)
  const [error, setError] = useState('')
  const [helpOpen, setHelpOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const firstName = user?.name.split(' ')[0] ?? 'Родитель'

  useEffect(() => {
    if (searchParams.get('link') === '1') {
      setScreen('code')
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const submitCode = async (next: string) => {
    if (next.length !== 6 || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const lookup = await authApi.lookupInvite(next)
      if (lookup.kind === 'STUDENT') {
        const result = await authApi.linkChild(next)
        setLinked(result)
      } else {
        setClubName(lookup.clubName)
        setPhase('child')
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось привязать ребёнка')
      setCode('')
    } finally {
      setSubmitting(false)
    }
  }

  const submitChild = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      const created = await parentApi.createChild({
        firstName: childFirstName.trim(),
        lastName: childLastName.trim(),
        birthDate,
        inviteCode: code,
      })
      setLinked({
        message: 'Ребёнок присоединился к клубу',
        studentId: created.id,
        studentName: `${created.firstName} ${created.lastName}`,
        age: created.age,
        clubName,
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось присоединить ребёнка')
    } finally {
      setSubmitting(false)
    }
  }

  const canJoin = childFirstName.trim() && childLastName.trim() && birthDate

  if (screen === 'how' || screen === 'support') {
    const title = screen === 'how' ? 'Как это работает?' : 'Поддержка'
    const text =
      screen === 'how'
        ? 'После привязки по коду от тренера здесь появятся пояс, посещаемость, оплаты и турниры вашего ребёнка. Код можно получить в секции или в личном кабинете тренера.'
        : 'Код клуба многоразовый: его можно отправить нескольким ученикам. Если код не подходит, попросите тренера прислать код из кабинета — раздел «Настройки клуба».'

    return (
      <OnboardingSubpage title={title} onBack={() => setScreen('welcome')}>
        <p className="text-sm leading-7 text-[#667085]">{text}</p>
      </OnboardingSubpage>
    )
  }

  if (screen === 'code') {
    return (
      <OnboardingSubpage
        title={phase === 'child' && !linked ? 'Данные ребёнка' : 'Привязка ребёнка'}
        onBack={() => {
          if (phase === 'child' && !linked) {
            setPhase('code')
            setError('')
            return
          }
          setScreen('welcome')
          setError('')
          setLinked(null)
          setCode('')
          setPhase('code')
          setClubName('')
          setChildFirstName('')
          setChildLastName('')
          setBirthDate('')
        }}
      >
        {phase === 'code' && (
          <p className="text-sm leading-6 text-[#667085]">Введите 6-значный код клуба, который вам прислал тренер</p>
        )}
        {phase === 'child' && !linked && (
          <p className="text-sm leading-6 text-[#667085]">
            Код клуба {clubName ? `«${clubName}» ` : ''}подошёл. Укажите ребёнка — он присоединится к секции.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
            {error}
          </p>
        )}
        {phase === 'code' && !linked && (
          <label className="relative mt-8 block">
            <span className="sr-only">Код клуба</span>
            <CodeBoxes value={code} accent={parentAccent} />
            <input
              className="absolute inset-0 cursor-text opacity-0"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              disabled={submitting}
              onChange={(e) => {
                const next = e.target.value.replace(/\D/g, '').slice(0, 6)
                setCode(next)
                if (next.length === 6) void submitCode(next)
              }}
            />
          </label>
        )}

        {phase === 'child' && !linked && (
          <form onSubmit={(event) => void submitChild(event)} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-[#101828]" htmlFor="join-first-name">Имя</label>
              <input
                id="join-first-name"
                value={childFirstName}
                onChange={(e) => setChildFirstName(e.target.value)}
                autoComplete="given-name"
                required
                className="mt-2 w-full rounded-2xl border border-[#e4e7ec] px-4 py-3 text-base text-[#101828] outline-none focus:border-[#1fa971]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#101828]" htmlFor="join-last-name">Фамилия</label>
              <input
                id="join-last-name"
                value={childLastName}
                onChange={(e) => setChildLastName(e.target.value)}
                autoComplete="family-name"
                required
                className="mt-2 w-full rounded-2xl border border-[#e4e7ec] px-4 py-3 text-base text-[#101828] outline-none focus:border-[#1fa971]"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#101828]" htmlFor="join-birth-date">Дата рождения</label>
              <input
                id="join-birth-date"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
                max={new Date().toISOString().slice(0, 10)}
                className="mt-2 w-full rounded-2xl border border-[#e4e7ec] px-4 py-3 text-base text-[#101828] outline-none focus:border-[#1fa971]"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !canJoin}
              className="flex min-h-12 w-full items-center justify-center rounded-2xl text-base font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: parentAccent }}
            >
              {submitting ? 'Присоединение…' : 'Присоединиться'}
            </button>
          </form>
        )}

        {linked && (
          <div className="mt-8">
            <div className="flex flex-col items-center text-center">
              <span className="flex size-12 items-center justify-center rounded-full text-white" style={{ backgroundColor: parentAccent }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="m5 12 5 5L20 7" />
                </svg>
              </span>
              <p className="mt-3 font-semibold text-[#101828]">Ребёнок присоединился к секции</p>
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#e4e7ec] p-4">
              <span className="flex size-12 items-center justify-center rounded-full bg-[#e8f8ef] text-[#1fa971]">
                <IconUser size={22} />
              </span>
              <span>
                <span className="block font-semibold text-[#101828]">{linked.studentName}</span>
                <span className="mt-0.5 block text-sm text-[#667085]">
                  {[linked.age != null ? `${linked.age} лет` : null, linked.groupName, linked.clubName].filter(Boolean).join(' · ')}
                </span>
              </span>
            </div>
            <button
              type="button"
              className="mt-6 flex min-h-12 w-full items-center justify-center rounded-2xl text-base font-semibold text-white"
              style={{ backgroundColor: parentAccent }}
              onClick={() => {
                setSelectedChildId(linked.studentId)
                void refresh().then(() => navigate('/app/profile'))
              }}
            >
              Перейти к профилю ребёнка
            </button>
            <button
              type="button"
              className="mt-3 w-full text-center text-sm font-semibold underline decoration-[#1fa971]/40 underline-offset-2"
              style={{ color: parentAccent }}
              onClick={() => {
                setLinked(null)
                setError('')
                setChildFirstName('')
                setChildLastName('')
                setBirthDate('')
                if (clubName) setPhase('child')
                else {
                  setCode('')
                  setPhase('code')
                }
              }}
            >
              Привязать ещё ребёнка
            </button>
          </div>
        )}
      </OnboardingSubpage>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col bg-white px-5 pt-[max(1.25rem,env(safe-area-inset-top,0px))] pb-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] text-[#667085]">Добро пожаловать!</p>
          <h1 className="mt-0.5 text-[1.75rem] font-extrabold leading-tight tracking-tight text-[#101828]">{firstName}</h1>
        </div>
        <span className="flex size-10 items-center justify-center text-[#101828]" aria-hidden>
          <IconBell size={22} />
        </span>
      </div>

      <section className="mt-7 rounded-[1.25rem] bg-[#e8f8ef] px-5 py-5">
        <h2 className="text-[17px] font-bold leading-snug text-[#101828]">Привяжите профиль ребёнка</h2>
        <p className="mt-2 text-sm leading-6 text-[#667085]">
          Введите код от тренера, чтобы увидеть успехи и расписание ребёнка
        </p>
        <button
          type="button"
          onClick={() => setScreen('code')}
          className="mt-5 flex min-h-[3rem] w-full items-center justify-center rounded-2xl text-[15px] font-semibold text-white shadow-[0_2px_8px_rgb(31_169_113_/_0.35)]"
          style={{ backgroundColor: parentAccent }}
        >
          Ввести код тренера
        </button>
        <button
          type="button"
          onClick={() => setHelpOpen((open) => !open)}
          className="mt-3 w-full text-center text-sm font-semibold underline decoration-[#1fa971]/45 underline-offset-[3px]"
          style={{ color: parentAccent }}
        >
          Где взять код?
        </button>
        {helpOpen && (
          <p className="mt-3 text-sm leading-6 text-[#667085]">
            Тренер присылает 6-значный код клуба. Код многоразовый: введите его и укажите ребёнка — он присоединится к секции.
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-[15px] font-bold text-[#101828]">О приложении</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-[#e4e7ec] bg-white">
          <AboutLinkRow title="Как это работает?" onClick={() => setScreen('how')} />
          <AboutLinkRow title="Поддержка" onClick={() => setScreen('support')} divider={false} />
        </div>
      </section>
    </div>
  )
}

function AboutLinkRow({
  title,
  onClick,
  divider = true,
}: {
  title: string
  onClick: () => void
  divider?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-4 text-left ${divider ? 'border-b border-[#e4e7ec]' : ''}`}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f2f4f7] text-[#667085]">
        <IconHelpCircle size={18} />
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium text-[#101828]">{title}</span>
      <IconChevronRight size={18} className="shrink-0 text-[#98a2b3]" />
    </button>
  )
}

function OnboardingSubpage({
  title,
  onBack,
  children,
}: {
  title: string
  onBack: () => void
  children: ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-lg bg-white px-5 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-6">
      <button
        type="button"
        onClick={onBack}
        aria-label="Назад"
        className="-ml-2 flex size-11 items-center justify-center rounded-full text-[#667085]"
      >
        <IconArrowLeft size={22} />
      </button>
      <h1 className="mt-1 text-2xl font-extrabold text-[#101828]">{title}</h1>
      <div className="mt-4">{children}</div>
    </div>
  )
}
