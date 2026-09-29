import { Link } from 'react-router-dom'
import { BeltProgressRing } from '../components/ui/BeltProgressRing'
import { IconArrowRight, IconTrophy, IconUser, IconUsers } from '../components/ui/Icons'

const features = [
  {
    icon: IconUser,
    title: 'Дневник родителя',
    text: 'Кольцо прогресса пояса, оплаты, награды и турниры — всё в одном экране.',
    link: '/for-parents',
  },
  {
    icon: IconUsers,
    title: 'Кабинет тренера',
    text: 'Посещаемость, ученики, напоминания об оплате и экспорт заявок.',
    link: '/for-coaches',
  },
  {
    icon: IconTrophy,
    title: 'Соревнования',
    text: 'Приглашения родителям, RSVP и Excel-выгрузка заявок.',
    link: '/login',
  },
]

const stats = [
  { value: '2 кабинета', label: 'родитель и тренер' },
  { value: 'Пояса', label: 'прогресс аттестации' },
  { value: 'RSVP', label: 'ответы на турниры' },
]

export function LandingPage() {
  return (
    <>
      <section className="hero-parent relative overflow-hidden px-5 py-16 pb-20 text-white md:py-24 md:pb-28">
        <div className="hero-orb hero-orb-green" aria-hidden />
        <div className="hero-orb hero-orb-blue" aria-hidden />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div className="fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-green/40 bg-brand-green/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-green-light">
              <span className="size-2 rounded-full bg-brand-green" />
              Karate Hub
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight md:text-5xl lg:text-[3.25rem]">
              Прогресс ребёнка — наглядно и просто
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-text-on-dark">
              Кольцо пояса, быстрые действия, статусы оплаты и турниров. Без таблиц и лишних кликов.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login?role=parent" className="btn-primary px-7 py-3.5 text-base">
                Дневник родителя
              </Link>
              <Link to="/login?role=coach" className="btn-on-dark px-7 py-3.5 text-base">
                Кабинет тренера
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-3">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className={`fade-in-up stagger-${i + 1} rounded-2xl border border-white/12 bg-navy-800/60 px-3 py-3 text-center`}
                >
                  <p className="text-sm font-bold">{s.value}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-text-on-dark">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="fade-in-up stagger-2 relative mx-auto w-full max-w-md">
            <div className="card-elevated overflow-hidden">
              <div className="bg-navy-900 px-6 py-8">
                <p className="text-center text-xs font-semibold uppercase tracking-wider text-text-on-dark">
                  Демо дневника
                </p>
                <div className="mt-4 flex justify-center">
                  <BeltProgressRing value={72} beltName="Белый" nextLabel="жёлтого" size={168} />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-success-bg px-3 py-2 text-center text-xs font-semibold text-success">
                    Оплачено
                  </div>
                  <div className="rounded-xl bg-warning-bg px-3 py-2 text-center text-xs font-semibold text-warning">
                    Турнир
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 bg-surface-muted p-4">
                {['Профиль', 'Награды', 'Чат', 'Архив'].map((label) => (
                  <div
                    key={label}
                    className="rounded-xl bg-surface py-3 text-center text-[11px] font-semibold text-text-secondary"
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16 lg:px-8">
        <div className="fade-in-up -mt-8 rounded-[2rem] border border-border bg-surface px-5 py-12 shadow-[var(--shadow-elevated)] sm:px-10 md:py-14">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-green">Возможности</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-text">Всё для каратэ-клуба</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {features.map((f, i) => (
              <Link
                key={f.title}
                to={f.link}
                className={`card-hover group fade-in-up stagger-${i + 1} flex flex-col p-6`}
              >
                <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-green-light text-brand-green ring-1 ring-brand-green/20">
                  <f.icon size={24} />
                </span>
                <p className="mt-5 text-lg font-bold text-text">{f.title}</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">{f.text}</p>
                <p className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-green transition group-hover:gap-2">
                  Подробнее
                  <IconArrowRight size={16} />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 lg:px-8">
        <div className="hero-parent fade-in-up relative mx-auto max-w-6xl overflow-hidden rounded-3xl px-8 py-14 text-center text-white md:px-16">
          <div className="hero-orb hero-orb-green right-0 left-auto scale-75" aria-hidden />
          <h2 className="relative text-2xl font-bold text-white md:text-3xl">Попробуйте демо прямо сейчас</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-text-on-dark">
            Родитель: +79004445566 · Тренер: +79001112233 · Код: 123456
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/login" className="btn-primary px-8 py-3.5">
              Войти
            </Link>
            <Link to="/register" className="btn-on-dark px-8 py-3.5">
              Регистрация
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
