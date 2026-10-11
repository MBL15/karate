import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { clearLoggedOutFlag, readLoggedOutFlag } from '../utils/session'
import { authApi } from '../api/auth'
import type { UserRole } from '../api/types'
import { ApiError } from '../api/client'
import {
  AuthBack,
  AuthButton,
  AuthField,
  AuthShell,
  FieldIcon,
  FormSummary,
  LockIcon,
  RoleIcon,
  type Tone,
} from '../components/auth/AuthWidgets'
import { loginPattern } from '../utils/format'
import { IconChevronRight, IconUser, IconUsers } from '../components/ui/Icons'
import { useAuth } from '../context/AuthContext'

type LoginKey = 'login' | 'password'

const loginOrder: LoginKey[] = ['login', 'password']
const loginIds: Record<LoginKey, string> = {
  login: 'auth-login',
  password: 'auth-password',
}

function parseRole(value: string | null): UserRole | null {
  const v = value?.toUpperCase()
  if (v === 'PARENT') return 'PARENT'
  if (v === 'COACH') return 'COACH'
  return null
}

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const role = parseRole(searchParams.get('role'))
  const navigate = useNavigate()
  const { user } = useAuth()
  const [enteredAs] = useState(user)
  const [loggedOut, setLoggedOut] = useState(readLoggedOutFlag)

  useEffect(() => {
    if (!loggedOut) return
    clearLoggedOutFlag()
    if (loggedOut === 'expired') return
    const timer = window.setTimeout(() => setLoggedOut(null), 5000)
    return () => window.clearTimeout(timer)
  }, [loggedOut])

  if (enteredAs) return <Navigate to={enteredAs.role === 'COACH' ? '/coach' : '/app'} replace />

  return (
    <AuthShell
      top={
        <div className="mb-4 flex h-11 items-center">
          <AuthBack
            onClick={() => navigate(role ? '/login' : '/')}
            label={role ? 'Назад к выбору роли' : 'На главную'}
          />
        </div>
      }
    >
      {loggedOut === 'expired' && (
        <p role="status" className="pop-in mb-5 rounded-2xl bg-warning-bg px-4 py-3 text-sm font-medium text-text">
          Сессия истекла — войдите снова, чтобы продолжить.
        </p>
      )}
      {loggedOut === 'out' && (
        <p role="status" className="pop-in mb-5 flex items-center gap-2.5 rounded-2xl bg-brand-green-light px-4 py-3 text-sm font-medium text-[#15803d]">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-green text-white">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12l5 5L20 7" />
            </svg>
          </span>
          Вы вышли из аккаунта. Войдите снова, когда понадобится.
        </p>
      )}
      <div key={role ?? 'pick'} className="wizard-step-forward flex flex-1 flex-col">
        {role ? <LoginForm role={role} /> : <LoginRolePicker />}
      </div>
    </AuthShell>
  )
}

function LoginRolePicker() {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight text-text">Вход</h1>
      <p className="mt-2 text-[15px] leading-6 text-text-secondary">Выберите, в какой кабинет входите</p>
      <nav aria-label="Выбор роли" className="mt-7 grid gap-3">
        <RoleLink to="/login?role=coach" tone="coach" title="Тренер" text="Группы, посещаемость и ученики" icon={<IconUser size={24} />} />
        <RoleLink to="/login?role=parent" tone="parent" title="Родитель" text="Дневник и достижения ребёнка" icon={<IconUsers size={24} />} />
      </nav>
      <p className="mt-auto pt-8 text-center text-sm text-text-secondary">
        Нет аккаунта?{' '}
        <Link to="/register" className="font-semibold text-brand-blue underline-offset-2 hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  )
}

function RoleLink({ to, tone, title, text, icon }: { to: string; tone: Tone; title: string; text: string; icon: ReactNode }) {
  return (
    <Link
      to={to}
      className={`group flex items-center gap-4 rounded-3xl border border-border-light bg-white p-4 shadow-[var(--shadow-card)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] active:scale-[0.99] ${
        tone === 'coach' ? 'hover:border-brand-blue/40' : 'hover:border-brand-green/40'
      }`}
    >
      <RoleIcon tone={tone} size="md">
        {icon}
      </RoleIcon>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-text">{title}</span>
        <span className="mt-0.5 block text-sm text-text-secondary">{text}</span>
      </span>
      <IconChevronRight size={20} className="shrink-0 text-text-muted transition group-hover:translate-x-0.5" />
    </Link>
  )
}

function LoginForm({ role }: { role: UserRole }) {
  const isCoach = role === 'COACH'
  const tone: Tone = isCoach ? 'coach' : 'parent'
  const [loginName, setLoginName] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState<Partial<Record<LoginKey, boolean>>>({})
  const [attempted, setAttempted] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [focusTick, setFocusTick] = useState(0)
  const summaryRef = useRef<HTMLDivElement>(null)
  const [wrongRole, setWrongRole] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string; search?: string } } | null)?.from

  useEffect(() => {
    if (focusTick) summaryRef.current?.focus()
  }, [focusTick])

  const problems = useMemo(() => {
    const errors: Partial<Record<LoginKey, string>> = {}
    const normalizedLogin = loginName.trim()
    if (!normalizedLogin) errors.login = 'Укажите логин'
    else if (!loginPattern.test(normalizedLogin)) errors.login = 'Латиница, от 3 символов: можно цифры, точку, дефис и _'
    if (!password) errors.password = 'Укажите пароль'
    else if (password.length < 6) errors.password = 'Пароль должен быть не короче 6 символов'
    else if (password.length > 72) errors.password = 'Пароль не длиннее 72 символов'
    return errors
  }, [loginName, password])

  const visible = (key: LoginKey) => ((attempted || touched[key]) ? problems[key] : undefined)
  const mark = (key: LoginKey) => setTouched((current) => ({ ...current, [key]: true }))
  const summary = attempted
    ? loginOrder.flatMap((key) => (problems[key] ? [{ id: loginIds[key], message: problems[key] }] : []))
    : []

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError('')
    setWrongRole(false)
    setAttempted(true)
    if (Object.keys(problems).length > 0) {
      setFocusTick((value) => value + 1)
      return
    }
    setSubmitting(true)
    try {
      const data = await authApi.login(loginName.trim(), password, role)
      login({
        userId: data.userId,
        name: data.name,
        login: data.login,
        phone: data.phone,
        role: data.role,
        clubId: data.clubId,
        token: data.token,
      })
      const home = data.role === 'COACH' ? '/coach' : '/app'
      const back = from && (from.pathname === home || from.pathname.startsWith(`${home}/`)) ? `${from.pathname}${from.search ?? ''}` : home
      navigate(back, { replace: true })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Нет связи с сервером'
      const mismatch = /роль не совпадает/i.test(message)
      setWrongRole(mismatch)
      setServerError(mismatch ? (isCoach ? 'Это аккаунт родителя, а не тренера' : 'Это аккаунт тренера, а не родителя') : message)
      setFocusTick((value) => value + 1)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} aria-busy={submitting} noValidate className="flex flex-1 flex-col">
      <div className="flex flex-col items-center text-center">
        <RoleIcon tone={tone}>{isCoach ? <IconUser size={28} /> : <IconUsers size={28} />}</RoleIcon>
        <h1 className="mt-4 text-[1.75rem] leading-tight font-bold tracking-tight text-text">
          {isCoach ? 'Вход тренера' : 'Вход родителя'}
        </h1>
        <p className="mt-2 text-[15px] leading-6 text-text-secondary">Логин и пароль вашего кабинета</p>
      </div>
      <FormSummary
        summaryRef={summaryRef}
        title={serverError ? 'Не получилось войти' : 'Исправьте ошибки в форме'}
        items={serverError ? [{ message: serverError }] : summary}
      />
      {wrongRole && (
        <Link
          to={`/login?role=${isCoach ? 'parent' : 'coach'}`}
          className={`mt-3 flex min-h-11 items-center justify-center rounded-2xl border text-sm font-semibold ${
            isCoach ? 'border-brand-green/30 text-brand-green' : 'border-brand-blue/30 text-brand-blue'
          }`}
        >
          Войти как {isCoach ? 'родитель' : 'тренер'}
        </Link>
      )}
      <div className="mt-6 space-y-4">
        <AuthField
          id={loginIds.login}
          label="Логин"
          tone={tone}
          icon={<FieldIcon><circle cx="12" cy="12" r="4" /><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1" /></FieldIcon>}
          value={loginName}
          onChange={(e) => setLoginName(e.target.value)}
          onBlur={() => mark('login')}
          error={visible('login')}
          placeholder="Ваш логин"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          name="username"
          maxLength={32}
          required
        />
        <AuthField
          id={loginIds.password}
          label="Пароль"
          tone={tone}
          revealable
          icon={<LockIcon />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => mark('password')}
          error={visible('password')}
          placeholder="Ваш пароль"
          autoComplete="current-password"
          name="password"
          maxLength={72}
          required
        />
        <p className="text-xs leading-relaxed text-text-muted">
          Забыли пароль? {isCoach ? 'Напишите на ' : 'Обратитесь к тренеру или напишите на '}
          <a href="mailto:info@karatehub.ru" className="font-semibold text-text-secondary underline underline-offset-2">
            info@karatehub.ru
          </a>
        </p>
      </div>
      <div className="mt-auto pt-8">
        <AuthButton tone={tone} type="submit" disabled={submitting}>
          {submitting ? 'Входим…' : 'Войти'}
        </AuthButton>
        <p className="mt-4 text-center text-sm text-text-secondary">
          Нет аккаунта?{' '}
          <Link
            to={`/register?role=${role.toLowerCase()}`}
            className={`font-semibold underline-offset-2 hover:underline ${isCoach ? 'text-brand-blue' : 'text-brand-green'}`}
          >
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </form>
  )
}
