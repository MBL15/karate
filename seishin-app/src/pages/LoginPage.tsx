import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../api/auth'
import type { UserRole } from '../api/types'
import { ApiError } from '../api/client'
import { BrandMark } from '../components/ui/BrandMark'
import { IconUser, IconUsers } from '../components/ui/Icons'
import { useAuth } from '../context/AuthContext'

const demoAccounts = {
  COACH: { phone: '+79001112233', name: 'Алексей Орлов', role: 'COACH' as const },
  PARENT: { phone: '+79004445566', name: 'Родитель Соколов', role: 'PARENT' as const },
}

function parseRole(value: string | null): UserRole | null {
  const v = value?.toUpperCase()
  if (v === 'PARENT') return 'PARENT'
  if (v === 'COACH') return 'COACH'
  return null
}

function normalizePhone(value: string) {
  const trimmed = value.trim()
  if (trimmed.startsWith('+')) return trimmed
  if (trimmed.startsWith('8') && trimmed.length === 11) return `+7${trimmed.slice(1)}`
  if (trimmed.startsWith('7') && trimmed.length === 11) return `+${trimmed}`
  return trimmed
}

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const isRegister = useLocation().pathname.startsWith('/register')
  const role = parseRole(searchParams.get('role'))

  if (!role) {
    return <AuthRolePicker register={isRegister} />
  }

  return <RoleAuthForm role={role} register={isRegister} />
}

function AuthRolePicker({ register }: { register: boolean }) {
  const base = register ? '/register' : '/login'
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl flex-col justify-center px-5 py-16">
      <div className="overflow-hidden rounded-[2rem] bg-navy-950 px-8 py-12 text-center text-white">
        <div className="flex justify-center">
          <BrandMark variant="site" size="lg" />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.25em] text-white/60">Karate Hub</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
          {register ? 'Регистрация' : 'Вход в систему'}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-white/70">
          {register
            ? 'Выберите роль — анкета одна, кабинеты разные'
            : 'Выберите, кем вы входите — кабинеты разные'}
        </p>
      </div>

      <div className="relative z-10 -mt-5 grid gap-6 sm:grid-cols-2">
        <Link to={`${base}?role=coach`} className="card-hover p-8">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-blue text-white">
            <IconUsers size={24} />
          </span>
          <p className="mt-6 text-xl font-bold text-text">Тренер</p>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            Посещаемость, ученики, награды и заявки на турниры.
          </p>
          <p className="mt-7 text-sm font-semibold text-brand-blue">
            {register ? 'Зарегистрироваться →' : 'Войти в кабинет →'}
          </p>
        </Link>
        <Link to={`${base}?role=parent`} className="card-hover p-8">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-green text-white">
            <IconUser size={24} />
          </span>
          <p className="mt-6 text-xl font-bold text-text">Родитель</p>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            Дневник ребёнка, прогресс пояса, оплаты и соревнования.
          </p>
          <p className="mt-7 text-sm font-semibold text-brand-green">
            {register ? 'Зарегистрироваться →' : 'Войти в дневник →'}
          </p>
        </Link>
      </div>

      <Link
        to={register ? '/login' : '/register'}
        className="mt-10 text-center text-sm text-text-secondary hover:text-text"
      >
        {register ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
      </Link>
      <Link to="/" className="mt-3 text-center text-sm text-text-secondary hover:text-text">
        ← На главную
      </Link>
    </div>
  )
}

function RoleAuthForm({ role, register }: { role: UserRole; register: boolean }) {
  const demo = demoAccounts[role]
  const isCoach = role === 'COACH'
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const errorRef = useRef<HTMLParagraphElement>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  useEffect(() => {
    setFirstName('')
    setLastName('')
    setPhone('')
    setCode('')
    setStep('form')
    setError('')
    setInfo('')
  }, [role, register])

  const completeLogin = (data: Awaited<ReturnType<typeof authApi.verifyOtp>>) => {
    login({
      userId: data.userId,
      name: data.name,
      phone: data.phone,
      role: data.role,
      clubId: data.clubId,
      token: data.token,
    })
    navigate(data.role === 'COACH' ? '/coach' : '/app')
  }

  const submitForm = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    const normalized = normalizePhone(phone)
    try {
      if (register) {
        await authApi.register({ firstName, lastName, phone: normalized, role })
      } else {
        await authApi.requestOtp(normalized, role)
      }
      setPhone(normalized)
      setStep('otp')
      setInfo(register ? 'Аккаунт создан. Тестовый код: 123456' : 'Код отправлен. Тестовый код: 123456')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Сервер недоступен')
    }
  }

  const verifyOtp = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const data = await authApi.verifyOtp(phone, code, role)
      completeLogin(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Неверный код')
    }
  }

  const demoLogin = async () => {
    setPhone(demo.phone)
    setError('')
    setInfo('')
    try {
      await authApi.requestOtp(demo.phone, role)
      setStep('otp')
      setCode('123456')
      setInfo(`Демо (${demo.name}): код 123456 уже подставлен — нажмите «Войти»`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Запустите бэкенд: gradlew.bat bootRun')
    }
  }

  const action = isCoach ? 'btn-coach w-full py-3.5' : 'btn-primary w-full py-3.5'
  const field = isCoach ? 'input-coach py-3.5' : 'input py-3.5'
  const switchTo = register ? `/login?role=${role.toLowerCase()}` : `/register?role=${role.toLowerCase()}`

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-lg flex-col justify-center px-5 py-16">
      <div className="overflow-hidden rounded-[2rem] bg-navy-950 px-8 py-12 text-center text-white">
        <div className="flex justify-center">
          <BrandMark variant={isCoach ? 'coach' : 'parent'} size="lg" />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
          {isCoach ? 'Кабинет тренера' : 'Дневник родителя'}
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
          {register
            ? isCoach
              ? 'Регистрация тренера'
              : 'Регистрация родителя'
            : isCoach
              ? 'Вход для тренера'
              : 'Вход для родителя'}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-white/70">
          {register ? 'Имя, фамилия и телефон — затем код из SMS' : 'Подтверждение номера по SMS-коду'}
        </p>
      </div>

      <div className="card relative z-10 -mt-5 p-8 sm:p-10">
        <ol className="mb-8 flex items-center gap-2" aria-label="Шаги входа">
          {(['form', 'otp'] as const).map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-2" aria-current={step === s ? 'step' : undefined}>
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  step === s || (step === 'otp' && s === 'form')
                    ? isCoach
                      ? 'bg-brand-blue text-white'
                      : 'bg-brand-green text-white'
                    : 'bg-surface-muted text-text-secondary'
                }`}
              >
                {i + 1}
              </span>
              <span className={`text-xs font-medium ${step === s ? 'text-text' : 'text-text-secondary'}`}>
                {s === 'form' ? (register ? 'Данные' : 'Телефон') : 'Код'}
              </span>
              {i === 0 && <div className="mx-1 h-px flex-1 bg-border" />}
            </li>
          ))}
        </ol>

        {error && (
          <p ref={errorRef} tabIndex={-1} role="alert" className="alert-error mb-6 outline-none">
            {error}
          </p>
        )}
        {info && (
          <p role="status" className="alert-info mb-6">
            {info}
          </p>
        )}

        {step === 'form' ? (
          <form onSubmit={submitForm} className="space-y-6">
            {register && (
              <>
                <div>
                  <label className="label" htmlFor="auth-first-name">Имя</label>
                  <input
                    id="auth-first-name"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Иван"
                    className={field}
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="auth-last-name">Фамилия</label>
                  <input
                    id="auth-last-name"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Иванов"
                    className={field}
                    required
                    autoComplete="family-name"
                  />
                </div>
              </>
            )}
            <div>
              <label className="label" htmlFor="auth-phone">Телефон</label>
              <input
                id="auth-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={register ? '+79001234567' : demo.phone}
                className={field}
                required
                autoComplete="tel"
                aria-invalid={Boolean(error)}
              />
            </div>
            <button type="submit" className={action}>
              {register ? 'Зарегистрироваться' : 'Получить код'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-6">
            <div>
              <label className="label" htmlFor="auth-code">Код из SMS</label>
              <input
                id="auth-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className={`${field} text-center text-xl tracking-[0.3em]`}
                required
                aria-invalid={Boolean(error)}
                aria-describedby="auth-code-hint"
              />
              <p id="auth-code-hint" className="mt-3 text-sm text-text-secondary">Тестовый код: 123456</p>
            </div>
            <button type="submit" className={action}>
              {register ? 'Подтвердить и войти' : 'Войти'}
            </button>
            <button type="button" onClick={() => setStep('form')} className="min-h-11 w-full text-sm font-medium text-text-secondary hover:text-text">
              Изменить данные
            </button>
          </form>
        )}

        {!register && (
          <>
            <button type="button" onClick={() => void demoLogin()} className={`mt-8 ${action}`}>
              Демо: {demo.phone}
            </button>
            <p className="mt-3 text-center text-sm text-text-muted">Код всегда 123456</p>
          </>
        )}
      </div>

      <Link to={switchTo} className="mt-10 text-center text-sm text-text-secondary hover:text-text">
        {register ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
      </Link>
      <Link to={register ? '/register' : '/login'} className="mt-3 text-center text-sm text-text-secondary hover:text-text">
        ← Выбрать другую роль
      </Link>
    </div>
  )
}
