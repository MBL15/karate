import { Link, Navigate } from 'react-router-dom'
import { IconChevronDown, IconChevronRight } from '../components/ui/Icons'
import { useAuth } from '../context/AuthContext'

function ToriiMark() {
  return (
    <svg width="84" height="72" viewBox="0 0 84 72" fill="none" aria-hidden>
      <path d="M4 10c12 4 64 4 76 0l-3 9H7L4 10Z" fill="#2563eb" />
      <rect x="12" y="24" width="60" height="6" rx="2" fill="#2563eb" />
      <rect x="18" y="19" width="8" height="51" rx="2" fill="#1d4ed8" />
      <rect x="58" y="19" width="8" height="51" rx="2" fill="#1d4ed8" />
      <rect x="38" y="19" width="8" height="11" rx="1.5" fill="#1d4ed8" />
      <path d="M36 36h12l-2 10-4-3-4 3-2-10Z" fill="#16a34a" />
    </svg>
  )
}

export function LandingPage() {
  const { user } = useAuth()
  if (user) return <Navigate to={user.role === 'COACH' ? '/coach' : '/app'} replace />

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[calc(3.25rem+env(safe-area-inset-bottom))] md:pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <picture>
        <source media="(min-width: 768px)" srcSet="/assets/landing/hero-desktop.jpg" />
        <img
          src="/assets/landing/hero-mobile.jpg"
          alt=""
          className="absolute inset-0 -z-20 size-full object-cover object-bottom"
          fetchPriority="high"
        />
      </picture>
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-white/85 via-white/30 to-white/70"
      />

      <div className="landing-rise mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center py-8 pb-[12vh] text-center">
        <ToriiMark />
        <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-text sm:text-6xl md:text-7xl">
          Каратэ <span className="text-brand-blue">Хаб</span>
        </h1>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.28em] text-text-secondary sm:text-sm sm:tracking-[0.32em]">
          Цифровая среда для каратэ
        </p>
        <span aria-hidden className="mt-8 h-px w-12 bg-brand-blue/30 md:mt-10" />
        <p className="mt-8 max-w-md text-lg leading-7 font-semibold text-balance text-text md:mt-10 md:max-w-lg md:text-xl">
          Больше внимания к развитию. Меньше рутины.
        </p>
        <p className="mt-3 max-w-md text-base leading-7 text-balance text-text-secondary md:max-w-lg">
          Всё для тренировок, развития спортсменов и общения с родителями — в одном приложении
        </p>
      </div>

      <div className="landing-rise landing-rise-late mx-auto w-full max-w-sm">
        <Link
          to="/register"
          className="group flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand-blue px-6 text-base font-semibold text-white shadow-[var(--shadow-blue)] transition hover:bg-brand-blue-hover active:scale-[0.98]"
        >
          Начать
          <IconChevronRight size={20} className="transition group-hover:translate-x-0.5" />
        </Link>
        <p className="mt-4 text-center text-sm text-text-secondary">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-semibold text-brand-blue underline-offset-2 hover:underline">
            Войти
          </Link>
        </p>
      </div>

      <a
        href="#site-footer"
        className="absolute inset-x-0 bottom-[calc(0.25rem+env(safe-area-inset-bottom))] mx-auto flex size-10 items-center justify-center rounded-full text-text-muted transition hover:text-text md:bottom-[calc(0.75rem+env(safe-area-inset-bottom))]"
        aria-label="Прокрутить к информации внизу страницы"
      >
        <IconChevronDown size={22} className="landing-bounce" />
      </a>
    </section>
  )
}
