import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi, type LinkedChild } from '../api/auth'
import { parentApi } from '../api/parent'
import { ApiError } from '../api/client'
import type { AuthResponse, UserRole } from '../api/types'
import {
  AuthBack,
  AuthButton,
  AuthDateField,
  AuthField,
  AuthShell,
  CodeBoxes,
  FieldIcon,
  FormSummary,
  LockIcon,
  RoleIcon,
  coachAccent,
  parentAccent,
  type Tone,
} from '../components/auth/AuthWidgets'
import { ageText, loginPattern } from '../utils/format'
import { StepProgress, type WizardStep } from '../components/auth/StepProgress'
import { Confetti, SuccessCheck } from '../components/ui/Confetti'
import { IconAward, IconCalendar, IconChevronRight, IconTrophy, IconUser, IconUsers } from '../components/ui/Icons'
import { useAuth } from '../context/AuthContext'

const karateStyles = ['Wado-Ryu', 'Shotokan', 'Goju-Ryu', 'Shito-Ryu', 'Kyokushin']
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ROLE = 0
const ACCOUNT = 1
const PROFILE = 2
const DONE = 3

function stepsFor(role: UserRole | null): WizardStep[] {
  return [
    { label: 'Выбор роли' },
    { label: 'Регистрация' },
    { label: role === 'PARENT' ? 'Привязка ребёнка' : 'Профиль' },
    { label: 'Готово' },
  ]
}

function yearsAgoIso(years: number) {
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function ConsentLinks() {
  const stop = (e: MouseEvent) => e.stopPropagation()
  return (
    <>
      Я согласен с{' '}
      <Link to="/docs/terms" target="_blank" onClick={stop} className="font-medium text-brand-blue underline-offset-2 hover:underline">
        условиями использования
      </Link>
      ,{' '}
      <Link to="/docs/privacy" target="_blank" onClick={stop} className="font-medium text-brand-blue underline-offset-2 hover:underline">
        политикой конфиденциальности
      </Link>{' '}
      и даю{' '}
      <Link to="/docs/consent" target="_blank" onClick={stop} className="font-medium text-brand-blue underline-offset-2 hover:underline">
        согласие на обработку данных
      </Link>
    </>
  )
}

function parseRole(value: string | null): UserRole | null {
  const v = value?.toUpperCase()
  if (v === 'PARENT') return 'PARENT'
  if (v === 'COACH') return 'COACH'
  return null
}

function toneOf(role: UserRole): Tone {
  return role === 'COACH' ? 'coach' : 'parent'
}

function errorText(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback
}

export function RegisterWizard() {
  const [searchParams] = useSearchParams()
  const initialRole = parseRole(searchParams.get('role'))
  const inviteCode = (searchParams.get('code') ?? '').replace(/\D/g, '').slice(0, 6)
  const [role, setRole] = useState<UserRole | null>(initialRole)
  const [step, setStep] = useState(initialRole ? ACCOUNT : ROLE)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [account, setAccount] = useState<AuthResponse | null>(null)
  const [clubName, setClubName] = useState('')
  const [linked, setLinked] = useState<LinkedChild | null>(null)
  const navigate = useNavigate()
  const { user } = useAuth()
  const [enteredAs] = useState(user)

  const go = (next: number) => {
    setDirection(next > step ? 'forward' : 'back')
    setStep(next)
  }

  const tone = role ? toneOf(role) : null
  const canGoBack = step === ROLE || step === ACCOUNT

  const back = () => {
    if (step === ROLE) navigate('/')
    else go(ROLE)
  }

  if (enteredAs) return <Navigate to={enteredAs.role === 'COACH' ? '/coach' : '/app'} replace />

  return (
    <AuthShell
      top={
        <>
          <div className="mb-3 flex h-11 items-center">
            {canGoBack && <AuthBack onClick={back} label={step === ROLE ? 'На главную' : 'Назад к выбору роли'} />}
          </div>
          <StepProgress steps={stepsFor(role)} current={step} tone={tone} />
        </>
      }
    >
      <div key={step} className={`flex flex-1 flex-col ${direction === 'forward' ? 'wizard-step-forward' : 'wizard-step-back'}`}>
        {step === ROLE && (
          <RoleStep
            onPick={(picked) => {
              setRole(picked)
              go(ACCOUNT)
            }}
          />
        )}
        {step === ACCOUNT && role && (
          <AccountStep
            role={role}
            onDone={(data, club) => {
              setAccount(data)
              setClubName(club)
              go(PROFILE)
            }}
          />
        )}
        {step === PROFILE && role === 'COACH' && <CoachProfileStep onDone={() => go(DONE)} />}
        {step === PROFILE && role === 'PARENT' && (
          <ParentLinkStep
            initialCode={inviteCode}
            onDone={(child) => {
              setLinked(child)
              go(DONE)
            }}
          />
        )}
        {step === DONE && role && (
          <DoneStep role={role} name={account?.name ?? ''} clubName={clubName} linked={linked} />
        )}
      </div>
    </AuthShell>
  )
}

function StepHeading({ title, lead, icon, tone }: { title: string; lead: string; icon?: ReactNode; tone?: Tone }) {
  return (
    <div className={icon ? 'flex flex-col items-center text-center' : ''}>
      {icon && tone && <RoleIcon tone={tone}>{icon}</RoleIcon>}
      <h1 className={`${icon ? 'mt-4' : ''} text-[1.75rem] leading-tight font-bold tracking-tight text-text`}>{title}</h1>
      <p className="mt-2 text-[15px] leading-6 text-text-secondary">{lead}</p>
    </div>
  )
}

function RoleStep({ onPick }: { onPick: (role: UserRole) => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <StepHeading title="Кто вы?" lead="Выберите роль, чтобы продолжить" />
      <div className="mt-7 grid gap-4">
        <RoleCard
          tone="coach"
          title="Тренер"
          text="Управление группами, тренировками, соревнованиями и развитием учеников"
          icon={<IconUser size={26} />}
          onClick={() => onPick('COACH')}
        />
        <RoleCard
          tone="parent"
          title="Родитель"
          text="Личный кабинет ребёнка, достижения, посещаемость и события"
          icon={<IconUsers size={26} />}
          onClick={() => onPick('PARENT')}
        />
      </div>
      <p className="mt-auto pt-8 text-center text-sm text-text-secondary">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="font-semibold text-brand-blue underline-offset-2 hover:underline">
          Войти
        </Link>
      </p>
    </div>
  )
}

function RoleCard({
  tone,
  title,
  text,
  icon,
  onClick,
}: {
  tone: Tone
  title: string
  text: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full cursor-pointer items-center gap-4 rounded-3xl border border-border-light bg-white p-5 text-left shadow-[var(--shadow-card)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] active:scale-[0.99] ${
        tone === 'coach' ? 'hover:border-brand-blue/40' : 'hover:border-brand-green/40'
      }`}
    >
      <span className="min-w-0 flex-1">
        <RoleIcon tone={tone} size="md">
          {icon}
        </RoleIcon>
        <span className="mt-4 block text-lg font-bold text-text">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-text-secondary">{text}</span>
      </span>
      <IconChevronRight
        size={22}
        className={`shrink-0 text-text-muted transition group-hover:translate-x-0.5 ${
          tone === 'coach' ? 'group-hover:text-brand-blue' : 'group-hover:text-brand-green'
        }`}
      />
    </button>
  )
}

type AccountKey = 'firstName' | 'lastName' | 'login' | 'password' | 'passwordAgain' | 'club' | 'accepted'

const accountOrder: AccountKey[] = ['firstName', 'lastName', 'login', 'password', 'passwordAgain', 'club', 'accepted']
const accountIds: Record<AccountKey, string> = {
  firstName: 'reg-first-name',
  lastName: 'reg-last-name',
  login: 'reg-login',
  password: 'reg-password',
  passwordAgain: 'reg-password-again',
  club: 'reg-club',
  accepted: 'reg-terms',
}

function AccountStep({ role, onDone }: { role: UserRole; onDone: (data: AuthResponse, clubName: string) => void }) {
  const isCoach = role === 'COACH'
  const tone = toneOf(role)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [clubName, setClubName] = useState('')
  const [loginName, setLoginName] = useState('')
  const [password, setPassword] = useState('')
  const [passwordAgain, setPasswordAgain] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [touched, setTouched] = useState<Partial<Record<AccountKey, boolean>>>({})
  const [attempted, setAttempted] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [focusTick, setFocusTick] = useState(0)
  const summaryRef = useRef<HTMLDivElement>(null)
  const { login } = useAuth()

  useEffect(() => {
    if (focusTick) summaryRef.current?.focus()
  }, [focusTick])

  const problems = useMemo(() => {
    const errors: Partial<Record<AccountKey, string>> = {}
    if (!firstName.trim()) errors.firstName = 'Укажите имя'
    if (!lastName.trim()) errors.lastName = 'Укажите фамилию'
    const normalizedLogin = loginName.trim()
    if (!normalizedLogin) errors.login = 'Укажите логин'
    else if (!loginPattern.test(normalizedLogin)) errors.login = 'Латиница, от 3 символов: можно цифры, точку, дефис и _'
    if (!password) errors.password = 'Укажите пароль'
    else if (password.length < 6) errors.password = 'Пароль должен быть не короче 6 символов'
    else if (password.length > 72) errors.password = 'Пароль не длиннее 72 символов'
    if (!passwordAgain) errors.passwordAgain = 'Повторите пароль'
    else if (passwordAgain !== password) errors.passwordAgain = 'Пароли не совпадают'
    if (isCoach && clubName.trim().length < 2) errors.club = 'Укажите название вашего клуба'
    else if (isCoach && /^karate\s*hub$/i.test(clubName.trim())) errors.club = 'Это демо-клуб приложения — укажите название своего клуба'
    if (!accepted) errors.accepted = 'Подтвердите согласие с условиями'
    return errors
  }, [accepted, clubName, firstName, isCoach, lastName, loginName, password, passwordAgain])

  const visible = (key: AccountKey) => ((attempted || touched[key]) ? problems[key] : undefined)
  const mark = (key: AccountKey) => setTouched((current) => ({ ...current, [key]: true }))
  const summary = attempted
    ? accountOrder.flatMap((key) => (problems[key] ? [{ id: accountIds[key], message: problems[key] }] : []))
    : []

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError('')
    setAttempted(true)
    if (Object.keys(problems).length > 0) {
      setFocusTick((value) => value + 1)
      return
    }
    setSubmitting(true)
    try {
      const data = await authApi.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        login: loginName.trim(),
        password,
        role,
        clubName: isCoach ? clubName.trim() : undefined,
      })
      await login({
        userId: data.userId,
        name: data.name,
        login: data.login,
        phone: data.phone,
        role: data.role,
        clubId: data.clubId,
        token: data.token,
      })
      onDone(data, clubName.trim())
    } catch (err) {
      setServerError(errorText(err, 'Сервер недоступен'))
      setFocusTick((value) => value + 1)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} aria-busy={submitting} noValidate className="flex flex-1 flex-col">
      <StepHeading
        tone={tone}
        icon={isCoach ? <IconUser size={28} /> : <IconUsers size={28} />}
        title={isCoach ? 'Регистрация тренера' : 'Регистрация родителя'}
        lead={
          isCoach
            ? 'Создайте профиль тренера, чтобы управлять группами и учениками'
            : 'Создайте профиль, чтобы следить за успехами вашего ребёнка'
        }
      />
      <FormSummary
        summaryRef={summaryRef}
        title={serverError ? 'Не получилось продолжить' : 'Исправьте ошибки в форме'}
        items={serverError ? [{ message: serverError }] : summary}
      />
      <div className="mt-6 space-y-4">
        <AuthField
          id={accountIds.firstName}
          label="Имя"
          tone={tone}
          icon={<IconUser size={18} />}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          onBlur={() => mark('firstName')}
          error={visible('firstName')}
          placeholder={isCoach ? 'Иван' : 'Мария'}
          autoComplete="given-name"
          maxLength={80}
          required
        />
        <AuthField
          id={accountIds.lastName}
          label="Фамилия"
          tone={tone}
          icon={<IconUser size={18} />}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          onBlur={() => mark('lastName')}
          error={visible('lastName')}
          placeholder={isCoach ? 'Петров' : 'Иванова'}
          autoComplete="family-name"
          maxLength={80}
          required
        />
        <AuthField
          id={accountIds.login}
          label="Логин"
          tone={tone}
          icon={<FieldIcon><circle cx="12" cy="12" r="4" /><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1" /></FieldIcon>}
          value={loginName}
          onChange={(e) => setLoginName(e.target.value)}
          onBlur={() => mark('login')}
          error={visible('login')}
          hint="Латиница, от 3 символов. Можно цифры, точку, дефис и _."
          placeholder="ivanov"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={32}
          required
        />
        <AuthField
          id={accountIds.password}
          label="Пароль"
          tone={tone}
          revealable
          icon={<LockIcon />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => mark('password')}
          error={visible('password')}
          placeholder="Не короче 6 символов"
          autoComplete="new-password"
          maxLength={72}
          required
        />
        <AuthField
          id={accountIds.passwordAgain}
          label="Повторите пароль"
          tone={tone}
          revealable
          revealLabel="повтор пароля"
          icon={<LockIcon />}
          value={passwordAgain}
          onChange={(e) => setPasswordAgain(e.target.value)}
          onBlur={() => mark('passwordAgain')}
          error={visible('passwordAgain')}
          placeholder="Ещё раз"
          autoComplete="new-password"
          maxLength={72}
          required
        />
        {isCoach && (
          <AuthField
            id={accountIds.club}
            label="Название клуба"
            tone={tone}
            icon={<FieldIcon><path d="M4 20V9l8-5 8 5v11" /><path d="M9 20v-6h6v6" /></FieldIcon>}
            value={clubName}
            onChange={(e) => setClubName(e.target.value)}
            onBlur={() => mark('club')}
            error={visible('club')}
            placeholder="Wakayama Dojo"
            autoComplete="organization"
            maxLength={120}
            required
          />
        )}
        <div>
          <label htmlFor={accountIds.accepted} className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl px-1 py-2 text-sm leading-5 text-text-secondary">
            <input
              id={accountIds.accepted}
              type="checkbox"
              checked={accepted}
              onChange={(e) => {
                setAccepted(e.target.checked)
                mark('accepted')
              }}
              aria-invalid={visible('accepted') ? true : undefined}
              aria-describedby={visible('accepted') ? `${accountIds.accepted}-error` : undefined}
              className={`mt-0.5 size-5 shrink-0 ${isCoach ? 'accent-brand-blue' : 'accent-brand-green'}`}
            />
            <span>
              <ConsentLinks />
            </span>
          </label>
          {visible('accepted') && (
            <p id={`${accountIds.accepted}-error`} className="mt-1 text-sm text-error">
              {visible('accepted')}
            </p>
          )}
        </div>
      </div>
      <div className="mt-auto pt-8">
        <AuthButton tone={tone} type="submit" disabled={submitting}>
          {submitting ? 'Создаём аккаунт…' : 'Продолжить'}
        </AuthButton>
        <p className="mt-4 text-center text-sm text-text-secondary">
          Уже есть аккаунт?{' '}
          <Link
            to={`/login?role=${role.toLowerCase()}`}
            className={`font-semibold underline-offset-2 hover:underline ${isCoach ? 'text-brand-blue' : 'text-brand-green'}`}
          >
            Войти
          </Link>
        </p>
      </div>
    </form>
  )
}

type ProfileKey = 'email' | 'birthDate' | 'experience'

const profileOrder: ProfileKey[] = ['email', 'birthDate', 'experience']
const profileIds: Record<ProfileKey, string> = {
  email: 'reg-email',
  birthDate: 'reg-birth',
  experience: 'reg-experience',
}

function CoachProfileStep({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [experience, setExperience] = useState('')
  const [style, setStyle] = useState('Wado-Ryu')
  const [touched, setTouched] = useState<Partial<Record<ProfileKey, boolean>>>({})
  const [attempted, setAttempted] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [focusTick, setFocusTick] = useState(0)
  const summaryRef = useRef<HTMLDivElement>(null)
  const maxBirth = yearsAgoIso(16)

  useEffect(() => {
    if (focusTick) summaryRef.current?.focus()
  }, [focusTick])

  const problems = useMemo(() => {
    const errors: Partial<Record<ProfileKey, string>> = {}
    if (email.trim() && !emailPattern.test(email.trim())) errors.email = 'Укажите корректный email'
    if (birthDate && birthDate > maxBirth) errors.birthDate = 'Укажите реальную дату рождения'
    else if (birthDate && birthDate < '1930-01-01') errors.birthDate = 'Проверьте год рождения'
    if (experience !== '' && Number(experience) > 80) errors.experience = 'Стаж не больше 80 лет'
    return errors
  }, [birthDate, email, experience, maxBirth])

  const visible = (key: ProfileKey) => ((attempted || touched[key]) ? problems[key] : undefined)
  const mark = (key: ProfileKey) => setTouched((current) => ({ ...current, [key]: true }))
  const summary = attempted
    ? profileOrder.flatMap((key) => (problems[key] ? [{ id: profileIds[key], message: problems[key] }] : []))
    : []

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError('')
    setAttempted(true)
    if (Object.keys(problems).length > 0) {
      setFocusTick((value) => value + 1)
      return
    }
    setSubmitting(true)
    try {
      await authApi.completeProfile({
        email: email.trim() || undefined,
        birthDate: birthDate || undefined,
        experienceYears: experience === '' ? undefined : Number(experience),
        karateStyle: style,
      })
      onDone()
    } catch (err) {
      setServerError(errorText(err, 'Не удалось сохранить профиль'))
      setFocusTick((value) => value + 1)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} aria-busy={submitting} noValidate className="flex flex-1 flex-col">
      <StepHeading
        title="Дополните профиль"
        lead="Все поля необязательные — их можно заполнить позже."
      />
      <FormSummary
        summaryRef={summaryRef}
        title={serverError ? 'Не получилось продолжить' : 'Исправьте ошибки в форме'}
        items={serverError ? [{ message: serverError }] : summary}
      />
      <div className="mt-6 space-y-4">
        <AuthField
          id={profileIds.email}
          label="Email (необязательно)"
          tone="coach"
          icon={<FieldIcon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></FieldIcon>}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => mark('email')}
          error={visible('email')}
          placeholder="ivan.petrov@mail.ru"
          autoComplete="email"
          maxLength={120}
        />
        <AuthDateField
          id={profileIds.birthDate}
          label="Дата рождения (необязательно)"
          tone="coach"
          value={birthDate}
          min="1930-01-01"
          max={maxBirth}
          onChange={setBirthDate}
          onBlur={() => mark('birthDate')}
          error={visible('birthDate')}
        />
        <AuthField
          id={profileIds.experience}
          label="Стаж тренерской работы, лет (необязательно)"
          tone="coach"
          icon={<FieldIcon><path d="M12 6v6l4 2" /><circle cx="12" cy="12" r="9" /></FieldIcon>}
          inputMode="numeric"
          value={experience}
          onChange={(e) => setExperience(e.target.value.replace(/\D/g, '').slice(0, 2))}
          onBlur={() => mark('experience')}
          error={visible('experience')}
          placeholder="5"
        />
        <div>
          <label htmlFor="reg-style" className="label">
            Стиль каратэ
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-muted">
              <IconAward size={18} />
            </span>
            <select
              id="reg-style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="input-coach min-h-12 appearance-none pr-10 pl-11 text-base sm:text-sm"
            >
              {karateStyles.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-text-muted" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </div>
        </div>
      </div>
      <div className="mt-auto pt-8">
        <AuthButton tone="coach" type="submit" disabled={submitting}>
          {submitting ? 'Сохраняем…' : 'Завершить регистрацию'}
        </AuthButton>
        <button
          type="button"
          onClick={onDone}
          disabled={submitting}
          className="mt-3 flex min-h-12 w-full items-center justify-center rounded-2xl text-sm font-semibold text-text-secondary transition hover:bg-surface-muted hover:text-text"
        >
          Пропустить, заполню позже
        </button>
      </div>
    </form>
  )
}

function ParentLinkStep({
  initialCode,
  onDone,
}: {
  initialCode: string
  onDone: (child: LinkedChild | null) => void
}) {
  const [code, setCode] = useState(initialCode)
  const [phase, setPhase] = useState<'code' | 'child' | 'confirm'>('code')
  const [clubName, setClubName] = useState('')
  const [studentName, setStudentName] = useState('')
  const [childFirstName, setChildFirstName] = useState('')
  const [childLastName, setChildLastName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [error, setError] = useState('')
  const [helpOpen, setHelpOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const submitCode = async (next: string) => {
    if (next.length !== 6 || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const lookup = await authApi.lookupInvite(next)
      setClubName(lookup.clubName)
      if (lookup.kind === 'STUDENT') {
        setStudentName(lookup.studentName ?? '')
        setPhase('confirm')
      } else {
        setPhase('child')
      }
    } catch (err) {
      setError(errorText(err, 'Не удалось проверить код'))
      setCode('')
    } finally {
      setSubmitting(false)
    }
  }

  const confirmStudent = async () => {
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      onDone(await authApi.linkChild(code))
    } catch (err) {
      setError(errorText(err, 'Не удалось привязать ребёнка'))
    } finally {
      setSubmitting(false)
    }
  }

  const resetCode = () => {
    setPhase('code')
    setCode('')
    setError('')
  }

  const minChildBirth = yearsAgoIso(25)
  const maxChildBirth = yearsAgoIso(3)
  const childBirthError = birthDate && (birthDate > maxChildBirth || birthDate < minChildBirth)
    ? 'Проверьте дату: возраст ребёнка от 3 до 25 лет'
    : ''

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
      onDone({
        message: 'Ребёнок присоединился к клубу',
        studentId: created.id,
        studentName: `${created.firstName} ${created.lastName}`,
        age: created.age,
        clubName,
      })
    } catch (err) {
      setError(errorText(err, 'Не удалось добавить ребёнка'))
    } finally {
      setSubmitting(false)
    }
  }

  const canJoin = Boolean(childFirstName.trim() && childLastName.trim() && birthDate && !childBirthError)

  return (
    <div className="flex flex-1 flex-col">
      {phase === 'confirm' ? (
        <>
          <StepHeading
            tone="parent"
            icon={<IconUser size={28} />}
            title="Это ваш ребёнок?"
            lead="Проверьте, что код открывает нужный профиль"
          />
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-border-light bg-brand-green-light/60 p-4">
            <RoleIcon tone="parent" size="md">
              <IconUser size={22} />
            </RoleIcon>
            <span className="min-w-0">
              <span className="block font-semibold text-text">{studentName || 'Ученик клуба'}</span>
              {clubName && <span className="mt-0.5 block text-sm text-text-secondary">{clubName}</span>}
            </span>
          </div>
          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-error-bg px-4 py-3 text-sm text-error">
              {error}
            </p>
          )}
          <div className="mt-auto pt-8">
            <AuthButton tone="parent" type="button" disabled={submitting} onClick={() => void confirmStudent()}>
              {submitting ? 'Привязываем…' : 'Да, привязать'}
            </AuthButton>
            <button
              type="button"
              onClick={resetCode}
              disabled={submitting}
              className="mt-3 flex min-h-12 w-full items-center justify-center rounded-2xl text-sm font-semibold text-text-secondary transition hover:bg-surface-muted hover:text-text"
            >
              Нет, ввести другой код
            </button>
          </div>
        </>
      ) : phase === 'code' ? (
        <>
          <StepHeading
            tone="parent"
            icon={<IconUsers size={28} />}
            title="Привяжите ребёнка"
            lead="Введите 6-значный код, который вам выдал тренер"
          />
          <label className="relative mt-8 block">
            <span className="sr-only">Код от тренера</span>
            <CodeBoxes value={code} accent={parentAccent} />
            <input
              className="absolute inset-0 cursor-text opacity-0"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              value={code}
              disabled={submitting}
              onChange={(e) => {
                const next = e.target.value.replace(/\D/g, '').slice(0, 6)
                setCode(next)
                if (next.length === 6) void submitCode(next)
              }}
            />
          </label>
          {submitting && <p className="mt-4 text-center text-sm text-text-secondary">Проверяем код…</p>}
          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-error-bg px-4 py-3 text-sm text-error">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => setHelpOpen((open) => !open)}
            aria-expanded={helpOpen}
            className="mx-auto mt-6 text-sm font-semibold text-brand-green underline decoration-brand-green/40 underline-offset-[3px]"
          >
            Где взять код?
          </button>
          {helpOpen && (
            <p className="mt-3 rounded-xl bg-brand-green-light px-4 py-3 text-sm leading-6 text-text-secondary">
              Код выдаёт тренер секции. Это может быть код клуба (тогда вы укажете данные ребёнка) или личный код
              ученика (тогда профиль привяжется сразу).
            </p>
          )}
          <div className="mt-auto pt-8">
            <AuthButton tone="parent" type="button" disabled={submitting || code.length !== 6} onClick={() => void submitCode(code)}>
              Привязать
            </AuthButton>
            <button
              type="button"
              onClick={() => onDone(null)}
              className="mt-3 flex min-h-12 w-full items-center justify-center rounded-2xl text-sm font-semibold text-text-secondary transition hover:bg-surface-muted hover:text-text"
            >
              Пропустить, привяжу позже
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={(event) => void submitChild(event)} className="flex flex-1 flex-col">
          <StepHeading
            title="Данные ребёнка"
            lead={`Код клуба${clubName ? ` «${clubName}»` : ''} подошёл. Укажите ребёнка, и он присоединится к секции.`}
          />
          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-error-bg px-4 py-3 text-sm text-error">
              {error}
            </p>
          )}
          <div className="mt-6 space-y-4">
            <AuthField
              id="reg-child-first"
              label="Имя ребёнка"
              icon={<IconUser size={18} />}
              value={childFirstName}
              onChange={(e) => setChildFirstName(e.target.value)}
              autoComplete="off"
              maxLength={80}
              required
            />
            <AuthField
              id="reg-child-last"
              label="Фамилия ребёнка"
              icon={<IconUser size={18} />}
              value={childLastName}
              onChange={(e) => setChildLastName(e.target.value)}
              autoComplete="off"
              maxLength={80}
              required
            />
            <AuthDateField
              id="reg-child-birth"
              label="Дата рождения"
              value={birthDate}
              min={minChildBirth}
              max={maxChildBirth}
              onChange={setBirthDate}
              error={childBirthError ? 'Укажите возраст от 3 до 25 лет' : undefined}
              required
            />
          </div>
          <div className="mt-auto pt-8">
            <AuthButton tone="parent" type="submit" disabled={submitting || !canJoin}>
              {submitting ? 'Добавляем…' : 'Присоединиться'}
            </AuthButton>
            <button
              type="button"
              onClick={resetCode}
              className="mt-3 flex min-h-12 w-full items-center justify-center rounded-2xl text-sm font-semibold text-text-secondary transition hover:bg-surface-muted hover:text-text"
            >
              Ввести другой код
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function DoneStep({
  role,
  name,
  clubName,
  linked,
}: {
  role: UserRole
  name: string
  clubName: string
  linked: LinkedChild | null
}) {
  const navigate = useNavigate()
  const isCoach = role === 'COACH'
  const tone = toneOf(role)
  const accent = isCoach ? coachAccent : parentAccent
  const firstName = name.split(' ')[0]

  const next = isCoach
    ? [
        { icon: <IconUsers size={18} />, text: 'Создайте группы — например, «Младшая» и «Старшая»' },
        { icon: <IconCalendar size={18} />, text: 'Поставьте для каждой группы дни и время тренировок' },
        { icon: <IconTrophy size={18} />, text: 'Пригласите учеников по коду клуба' },
      ]
    : [
        { icon: <IconAward size={18} />, text: 'Следите за поясом и наградами ребёнка' },
        { icon: <IconCalendar size={18} />, text: 'Смотрите расписание и посещаемость' },
        { icon: <IconTrophy size={18} />, text: 'Отвечайте на приглашения на соревнования' },
      ]

  return (
    <div className="flex flex-1 flex-col">
      <Confetti />
      <div className="flex flex-col items-center pt-2 text-center">
        <SuccessCheck tone={tone} />
        <h1 className="mt-5 text-[1.75rem] leading-tight font-bold tracking-tight text-text">Профиль создан!</h1>
        <p className="mt-2 text-[15px] leading-6 text-text-secondary">
          {firstName ? `${firstName}, добро` : 'Добро'} пожаловать в {isCoach ? clubName : 'Каратэ Хаб'}.
          <br />
          Вы успешно зарегистрированы.
        </p>
      </div>

      {linked && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border-light bg-brand-green-light/60 p-4">
          <RoleIcon tone="parent" size="md">
            <IconUser size={22} />
          </RoleIcon>
          <span className="min-w-0">
            <span className="block font-semibold text-text">{linked.studentName}</span>
            <span className="mt-0.5 block text-sm text-text-secondary">
              {[linked.age != null ? ageText(linked.age) : null, linked.groupName, linked.clubName].filter(Boolean).join(' · ')}
            </span>
          </span>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-border-light p-5">
        <p className="text-sm font-semibold text-text">Что дальше?</p>
        <ul className="mt-4 space-y-3.5">
          {next.map((item) => (
            <li key={item.text} className="flex items-center gap-3 text-sm text-text-secondary">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ color: accent, backgroundColor: `${accent}14` }}>
                {item.icon}
              </span>
              {item.text}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto pt-8">
        <AuthButton tone={tone} type="button" onClick={() => navigate(isCoach ? '/coach' : '/app')}>
          Перейти в приложение
        </AuthButton>
      </div>
    </div>
  )
}
