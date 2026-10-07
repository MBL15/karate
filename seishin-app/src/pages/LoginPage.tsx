import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../api/auth'
import type { UserRole } from '../api/types'
import { ApiError } from '../api/client'
import { AuthBack, AuthButton, AuthField, AuthShell, FieldIcon } from '../components/auth/AuthWidgets'
import { IconAward, IconCalendar, IconUser, IconUsers } from '../components/ui/Icons'
import { useAuth } from '../context/AuthContext'

const karateStyles = ['Wado-Ryu', 'Shotokan', 'Goju-Ryu', 'Shito-Ryu', 'Kyokushin']

const loginPattern = /^[a-zA-Z][a-zA-Z0-9._-]{2,31}$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Step = 'form' | 'profile' | 'done'
type Tone = 'coach' | 'parent'
type AccountKey = 'firstName' | 'lastName' | 'login' | 'password' | 'passwordAgain'
type ProfileKey = 'email' | 'birthDate' | 'experience' | 'accepted'

const accountOrder: AccountKey[] = ['firstName', 'lastName', 'login', 'password', 'passwordAgain']
const profileOrder: ProfileKey[] = ['email', 'birthDate', 'experience', 'accepted']

const accountIds: Record<AccountKey, string> = {
  firstName: 'auth-first-name',
  lastName: 'auth-last-name',
  login: 'auth-login',
  password: 'auth-password',
  passwordAgain: 'auth-password-again',
}

const profileIds: Record<ProfileKey, string> = {
  email: 'auth-email',
  birthDate: 'auth-birth',
  experience: 'auth-experience',
  accepted: 'auth-terms',
}

function parseRole(value: string | null): UserRole | null {
  const v = value?.toUpperCase()
  if (v === 'PARENT') return 'PARENT'
  if (v === 'COACH') return 'COACH'
  return null
}

function todayIso() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const isRegister = useLocation().pathname.startsWith('/register')
  const role = parseRole(searchParams.get('role'))

  if (!role) return <AuthRolePicker register={isRegister} />
  return <RoleAuthForm role={role} register={isRegister} />
}

function AuthRolePicker({ register }: { register: boolean }) {
  const base = register ? '/register' : '/login'
  return (
    <AuthShell
      heroTitle={register ? 'Создайте кабинет секции' : 'Войдите в Karate Hub'}
      heroLead={
        register
          ? 'Тренер ведёт группы и посещаемость. Родитель смотрит дневник ребёнка. Анкеты разные — выберите свою роль.'
          : 'Один клуб, два кабинета. Тренер отмечает занятия, родитель следит за поясом, наградами и соревнованиями.'
      }
      points={['Группы, журнал и награды для тренера', 'Дневник, пояс и чат для родителя', 'Демо-вход без своей почты']}
    >
      <p className="text-xs font-semibold tracking-[0.16em] text-text-muted uppercase">Karate Hub</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-text">{register ? 'Регистрация' : 'Вход'}</h1>
      <p className="mt-2 text-sm leading-6 text-text-secondary">
        {register ? 'Выберите роль — дальше откроется своя анкета.' : 'Выберите, в какой кабинет входите.'}
      </p>
      <nav aria-label="Выбор роли" className="mt-8 grid gap-3">
        <RoleCard
          to={`${base}?role=coach`}
          tone="coach"
          title="Тренер"
          text="Группы, посещаемость и ученики"
          icon={<IconUsers size={22} />}
        />
        <RoleCard
          to={`${base}?role=parent`}
          tone="parent"
          title="Родитель"
          text="Дневник ребёнка и привязка по коду"
          icon={<IconUser size={22} />}
        />
      </nav>
      <p className="mt-8 text-center text-sm text-text-secondary">
        {register ? 'Уже есть аккаунт? ' : 'Нет аккаунта? '}
        <Link to={register ? '/login' : '/register'} className="font-semibold text-navy-900 underline-offset-2 hover:underline">
          {register ? 'Войти' : 'Зарегистрироваться'}
        </Link>
      </p>
    </AuthShell>
  )
}

function RoleCard({
  to,
  tone,
  title,
  text,
  icon,
}: {
  to: string
  tone: Tone
  title: string
  text: string
  icon: ReactNode
}) {
  return (
    <Link
      to={to}
      className="group flex min-h-20 cursor-pointer items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] transition duration-200 hover:-translate-y-0.5 hover:border-brand-green/30 hover:shadow-[var(--shadow-elevated)] active:scale-[0.99]"
    >
      <span
        className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${
          tone === 'coach' ? 'bg-navy-900 text-white' : 'bg-brand-green text-navy-950'
        }`}
      >
        {icon}
      </span>
      <span>
        <span className="block font-semibold text-text">{title}</span>
        <span className="mt-0.5 block text-sm text-text-secondary">{text}</span>
      </span>
    </Link>
  )
}

function RoleAuthForm({ role, register }: { role: UserRole; register: boolean }) {
  const isCoach = role === 'COACH'
  const tone: Tone = isCoach ? 'coach' : 'parent'
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [clubName, setClubName] = useState('')
  const [loginName, setLoginName] = useState('')
  const [password, setPassword] = useState('')
  const [passwordAgain, setPasswordAgain] = useState('')
  const [email, setEmail] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [experience, setExperience] = useState('')
  const [style, setStyle] = useState('Wado-Ryu')
  const [accepted, setAccepted] = useState(false)
  const [step, setStep] = useState<Step>('form')
  const [touched, setTouched] = useState<Partial<Record<AccountKey | ProfileKey, boolean>>>({})
  const [attempted, setAttempted] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [focusTick, setFocusTick] = useState(0)
  const summaryRef = useRef<HTMLDivElement>(null)
  const { login } = useAuth()
  const navigate = useNavigate()
  const maxBirth = todayIso()

  useEffect(() => {
    if (focusTick) summaryRef.current?.focus()
  }, [focusTick])

  useEffect(() => {
    setStep('form')
    setServerError('')
    setAttempted(false)
    setTouched({})
    setLoginName('')
    setPassword('')
    setPasswordAgain('')
    setFirstName('')
    setLastName('')
    setClubName('')
  }, [role, register])

  useEffect(() => {
    setAttempted(false)
    setTouched({})
    setServerError('')
  }, [step])

  const home = isCoach ? '/coach' : '/app'

  const accountProblems = useMemo(() => {
    const errors: Partial<Record<AccountKey, string>> = {}
    if (register && !firstName.trim()) errors.firstName = 'Укажите имя'
    if (register && isCoach && !lastName.trim()) errors.lastName = 'Укажите фамилию'
    const normalizedLogin = loginName.trim()
    if (!normalizedLogin) errors.login = 'Укажите логин'
    else if (!loginPattern.test(normalizedLogin)) errors.login = 'Латиница, от 3 символов: можно цифры, точку, дефис и _'
    if (!password) errors.password = 'Укажите пароль'
    else if (password.length < 6) errors.password = 'Пароль должен быть не короче 6 символов'
    else if (password.length > 72) errors.password = 'Пароль не длиннее 72 символов'
    if (register && !passwordAgain) errors.passwordAgain = 'Повторите пароль'
    else if (register && passwordAgain !== password) errors.passwordAgain = 'Пароли не совпадают'
    return errors
  }, [firstName, isCoach, lastName, loginName, password, passwordAgain, register])

  const profileProblems = useMemo(() => {
    const errors: Partial<Record<ProfileKey, string>> = {}
    if (email.trim() && !emailPattern.test(email.trim())) errors.email = 'Укажите корректный email'
    if (!birthDate) errors.birthDate = 'Укажите дату рождения'
    else if (birthDate > maxBirth) errors.birthDate = 'Дата не может быть в будущем'
    if (experience === '') errors.experience = 'Укажите стаж в годах'
    else if (Number(experience) > 80) errors.experience = 'Стаж не больше 80 лет'
    if (!accepted) errors.accepted = 'Подтвердите согласие с условиями'
    return errors
  }, [accepted, birthDate, email, experience, maxBirth])

  const visibleAccount = (key: AccountKey) => ((attempted || touched[key]) ? accountProblems[key] : undefined)
  const visibleProfile = (key: ProfileKey) => ((attempted || touched[key]) ? profileProblems[key] : undefined)

  const accountSummary = attempted
    ? accountOrder.flatMap((key) => (accountProblems[key] ? [{ id: accountIds[key], message: accountProblems[key] }] : []))
    : []
  const profileSummary = attempted
    ? profileOrder.flatMap((key) => (profileProblems[key] ? [{ id: profileIds[key], message: profileProblems[key] }] : []))
    : []

  const mark = (key: AccountKey | ProfileKey) => setTouched((current) => ({ ...current, [key]: true }))

  const enterApp = (data: Awaited<ReturnType<typeof authApi.login>>) => {
    login({
      userId: data.userId,
      name: data.name,
      login: data.login,
      phone: data.phone,
      role: data.role,
      clubId: data.clubId,
      token: data.token,
    })
    if (!register) {
      navigate(data.role === 'COACH' ? '/coach' : '/app')
      return
    }
    if (data.role === 'COACH') setStep('profile')
    else navigate('/app')
  }

  const submitForm = async (e: FormEvent) => {
    e.preventDefault()
    setServerError('')
    setAttempted(true)
    if (Object.keys(accountProblems).length > 0) {
      setFocusTick((value) => value + 1)
      return
    }
    setSubmitting(true)
    try {
      const data = register
        ? await authApi.register({
            firstName: firstName.trim(),
            lastName: isCoach ? lastName.trim() : undefined,
            login: loginName.trim(),
            password,
            role,
            clubName: isCoach && clubName.trim() ? clubName.trim() : undefined,
          })
        : await authApi.login(loginName.trim(), password, role)
      enterApp(data)
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Сервер недоступен')
      setFocusTick((value) => value + 1)
    } finally {
      setSubmitting(false)
    }
  }

  const finishProfile = async (e: FormEvent) => {
    e.preventDefault()
    setServerError('')
    setAttempted(true)
    if (Object.keys(profileProblems).length > 0) {
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
      setStep('done')
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Не удалось сохранить профиль')
      setFocusTick((value) => value + 1)
    } finally {
      setSubmitting(false)
    }
  }

  const clubLabel = clubName.trim() || 'Karate Hub'
  const hero = register
    ? isCoach
      ? {
          title: 'Кабинет тренера',
          lead: 'После регистрации можно завести группы, отметить занятие и выдать награду.',
          points: ['Своё название клуба', 'Журнал посещаемости', 'Пояса, бейджи и соревнования'],
        }
      : {
          title: 'Дневник родителя',
          lead: 'Аккаунт нужен, чтобы привязать ребёнка по коду тренера и видеть его прогресс.',
          points: ['Привязка по коду из клуба', 'Пояс, награды и история', 'Чат с тренером'],
        }
    : isCoach
      ? {
          title: 'С возвращением, тренер',
          lead: 'Журнал, расписание и ученики открываются сразу после входа.',
          points: ['Отметить занятие за минуту', 'Список групп и родителей', 'Демо-аккаунт Алексея Орлова'],
        }
      : {
          title: 'Дневник уже ждёт',
          lead: 'Войдите, чтобы открыть пояс, ближайшее занятие и сообщения тренера.',
          points: ['Прогресс ребёнка', 'Соревнования и документы', 'Демо-аккаунт семьи Соколовых'],
        }

  return (
    <AuthShell heroTitle={hero.title} heroLead={hero.lead} points={hero.points} showHome={step === 'form'}>
      {step === 'form' && (
        <AuthBack
          onClick={() => {
            setServerError('')
            navigate(register ? '/register' : '/login')
          }}
        />
      )}

      {register && isCoach && <CoachSteps step={step} />}

      {step === 'form' && (
        <form onSubmit={submitForm} aria-busy={submitting} noValidate className="flex flex-1 flex-col">
          <RoleBadge tone={tone} label={isCoach ? 'Тренер' : 'Родитель'} />
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-text">
            {register ? (isCoach ? 'Регистрация тренера' : 'Регистрация родителя') : isCoach ? 'Вход тренера' : 'Вход родителя'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            {register
              ? isCoach
                ? 'Имя, логин и пароль. Клуб можно назвать сразу или оставить Karate Hub.'
                : 'Имя, логин и пароль. Ребёнка привяжете кодом уже в дневнике.'
              : 'Логин и пароль кабинета. Пароль можно вставить из менеджера.'}
          </p>
          <FormSummary
            summaryRef={summaryRef}
            title={serverError ? 'Не получилось продолжить' : 'Исправьте ошибки в форме'}
            items={serverError ? [{ message: serverError }] : accountSummary}
          />
          <div className="mt-6 space-y-4">
            {register && (
              <AuthField
                id={accountIds.firstName}
                label="Имя"
                tone={tone}
                icon={<IconUser size={18} />}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onBlur={() => mark('firstName')}
                error={visibleAccount('firstName')}
                placeholder={isCoach ? 'Иван' : 'Мария'}
                autoComplete="given-name"
                name="given-name"
                maxLength={80}
                required
              />
            )}
            {register && isCoach && (
              <AuthField
                id={accountIds.lastName}
                label="Фамилия"
                tone={tone}
                icon={<IconUser size={18} />}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onBlur={() => mark('lastName')}
                error={visibleAccount('lastName')}
                placeholder="Петров"
                autoComplete="family-name"
                name="family-name"
                maxLength={80}
                required
              />
            )}
            <AuthField
              id={accountIds.login}
              label="Логин"
              tone={tone}
              icon={<IconUser size={18} />}
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              onBlur={() => mark('login')}
              error={visibleAccount('login')}
              hint="Латиница, от 3 символов. Можно цифры, точку, дефис и _."
              placeholder="ivanov"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              name="username"
              maxLength={32}
              required
            />
            <AuthField
              id={accountIds.password}
              label="Пароль"
              tone={tone}
              revealable
              icon={<FieldIcon><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></FieldIcon>}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => mark('password')}
              error={visibleAccount('password')}
              hint="Не короче 6 символов. Можно вставить из менеджера паролей."
              placeholder="Не короче 6 символов"
              autoComplete={register ? 'new-password' : 'current-password'}
              name="password"
              maxLength={72}
              required
            />
            {register && (
              <AuthField
                id={accountIds.passwordAgain}
                label="Повторите пароль"
                tone={tone}
                revealable
                revealLabel="повтор пароля"
                icon={<FieldIcon><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></FieldIcon>}
                value={passwordAgain}
                onChange={(e) => setPasswordAgain(e.target.value)}
                onBlur={() => mark('passwordAgain')}
                error={visibleAccount('passwordAgain')}
                placeholder="Ещё раз"
                autoComplete="new-password"
                name="password-confirm"
                maxLength={72}
                required
              />
            )}
            {register && isCoach && (
              <AuthField
                id="auth-club"
                label="Название клуба"
                tone={tone}
                icon={<FieldIcon><path d="M4 20V9l8-5 8 5v11" /><path d="M9 20v-6h6v6" /></FieldIcon>}
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                hint="Необязательно. Если пусто, клуб будет называться Karate Hub."
                placeholder="Wakayama Dojo"
                autoComplete="organization"
                name="organization"
                maxLength={120}
              />
            )}
          </div>
          <div className="mt-8">
            <AuthButton tone={tone} type="submit" disabled={submitting}>
              {submitting ? (register ? 'Создаём аккаунт…' : 'Входим…') : register ? 'Продолжить' : 'Войти'}
            </AuthButton>
            <p className="mt-4 text-center text-sm leading-6 text-text-secondary">
              {register ? 'Уже есть аккаунт? ' : 'Нет аккаунта? '}
              <Link
                to={register ? `/login?role=${role.toLowerCase()}` : `/register?role=${role.toLowerCase()}`}
                className="font-semibold text-navy-900 underline-offset-2 hover:underline"
              >
                {register ? 'Войти' : 'Зарегистрироваться'}
              </Link>
            </p>
          </div>
        </form>
      )}

      {step === 'profile' && (
        <form onSubmit={finishProfile} aria-busy={submitting} noValidate className="flex flex-1 flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-text">Дополните профиль</h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Эти данные видите только вы. Email можно пропустить.
          </p>
          <FormSummary
            summaryRef={summaryRef}
            title={serverError ? 'Не получилось продолжить' : 'Исправьте ошибки в форме'}
            items={serverError ? [{ message: serverError }] : profileSummary}
          />
          <div className="mt-6 space-y-4">
            <AuthField
              id={profileIds.email}
              label="Email"
              tone={tone}
              icon={<FieldIcon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></FieldIcon>}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => mark('email')}
              error={visibleProfile('email')}
              hint="Необязательно."
              placeholder="ivan.petrov@email.ru"
              autoComplete="email"
              name="email"
              maxLength={120}
            />
            <AuthField
              id={profileIds.birthDate}
              label="Дата рождения"
              tone={tone}
              type="date"
              value={birthDate}
              max={maxBirth}
              onChange={(e) => setBirthDate(e.target.value)}
              onBlur={() => mark('birthDate')}
              error={visibleProfile('birthDate')}
              required
            />
            <AuthField
              id={profileIds.experience}
              label="Стаж тренерской работы, лет"
              tone={tone}
              icon={<FieldIcon><path d="M12 6v6l4 2" /><circle cx="12" cy="12" r="9" /></FieldIcon>}
              inputMode="numeric"
              value={experience}
              onChange={(e) => setExperience(e.target.value.replace(/\D/g, '').slice(0, 2))}
              onBlur={() => mark('experience')}
              error={visibleProfile('experience')}
              placeholder="5"
              required
            />
            <div>
              <label htmlFor="auth-style" className="label">
                Стиль каратэ
              </label>
              <div className="relative">
                <select id="auth-style" value={style} onChange={(e) => setStyle(e.target.value)} className="input-coach min-h-12 appearance-none pr-10">
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
            <div>
              <label htmlFor={profileIds.accepted} className="flex min-h-12 items-start gap-3 rounded-xl border border-border px-3 py-3 text-sm leading-5 text-text">
                <input
                  id={profileIds.accepted}
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => {
                    setAccepted(e.target.checked)
                    mark('accepted')
                  }}
                  aria-invalid={visibleProfile('accepted') ? true : undefined}
                  aria-describedby={visibleProfile('accepted') ? `${profileIds.accepted}-error` : undefined}
                  className="mt-0.5 size-5 shrink-0 accent-navy-900"
                />
                <span>Я согласен с условиями использования и политикой конфиденциальности</span>
              </label>
              {visibleProfile('accepted') && (
                <p id={`${profileIds.accepted}-error`} className="mt-1.5 text-sm text-error">
                  {visibleProfile('accepted')}
                </p>
              )}
            </div>
          </div>
          <div className="mt-8">
            <AuthButton tone={tone} type="submit" disabled={submitting}>
              {submitting ? 'Сохраняем…' : 'Завершить регистрацию'}
            </AuthButton>
          </div>
        </form>
      )}

      {step === 'done' && (
        <div className="flex flex-1 flex-col">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-green text-navy-950">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m5 12 5 5L20 7" />
            </svg>
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-text">Профиль создан</h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Добро пожаловать в {clubLabel}. Кабинет тренера уже открыт.
          </p>
          <div className="mt-8">
            <p className="text-sm font-semibold text-text">Что дальше</p>
            <ul className="mt-4 space-y-3">
              {[
                { icon: <IconUsers size={18} />, text: 'Создайте группы и добавьте учеников' },
                { icon: <IconCalendar size={18} />, text: 'Отмечайте посещаемость на тренировках' },
                { icon: <IconAward size={18} />, text: 'Выдавайте награды и следите за прогрессом' },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-3 text-sm text-text">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white">
                    {item.icon}
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8">
            <AuthButton tone={tone} type="button" onClick={() => navigate(home)}>
              Перейти в приложение
            </AuthButton>
          </div>
        </div>
      )}
    </AuthShell>
  )
}

function RoleBadge({ tone, label }: { tone: Tone; label: string }) {
  return (
    <p
      className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
        tone === 'coach' ? 'bg-navy-900 text-white' : 'bg-brand-green-light text-navy-950'
      }`}
    >
      {label}
    </p>
  )
}

function CoachSteps({ step }: { step: Step }) {
  const items: { key: Step; label: string }[] = [
    { key: 'form', label: 'Аккаунт' },
    { key: 'profile', label: 'Профиль' },
    { key: 'done', label: 'Готово' },
  ]
  const index = items.findIndex((item) => item.key === step)
  return (
    <ol aria-label="Шаги регистрации" className="mb-6 grid grid-cols-3 gap-2">
      {items.map((item, itemIndex) => {
        const state = itemIndex < index ? 'done' : itemIndex === index ? 'current' : 'upcoming'
        return (
          <li key={item.key} aria-current={state === 'current' ? 'step' : undefined}>
            <span
              className={`block h-1 rounded-full ${
                state === 'done' ? 'bg-brand-green' : state === 'current' ? 'bg-navy-900' : 'bg-surface-subtle'
              }`}
            />
            <span
              className={`mt-2 block text-xs ${
                state === 'current' ? 'font-semibold text-text' : state === 'done' ? 'font-medium text-text-secondary' : 'text-text-muted'
              }`}
            >
              {itemIndex + 1}. {item.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function FormSummary({
  summaryRef,
  title,
  items,
}: {
  summaryRef: React.RefObject<HTMLDivElement | null>
  title: string
  items: { id?: string; message: string }[]
}) {
  if (items.length === 0) return null
  return (
    <div ref={summaryRef} tabIndex={-1} role="alert" aria-labelledby="auth-error-title" className="mt-4 rounded-xl bg-error-bg px-4 py-3 text-sm text-error outline-none">
      <h2 id="auth-error-title" className="font-semibold">
        {title}
      </h2>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={`${item.id ?? 'server'}-${item.message}`}>
            {item.id ? (
              <a href={`#${item.id}`} className="underline underline-offset-2">
                {item.message}
              </a>
            ) : (
              item.message
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
