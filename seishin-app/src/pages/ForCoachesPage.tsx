import { Link } from 'react-router-dom'

const features = [
  ['Посещаемость', 'Массовая отметка за 2 клика, отработки и гостевые ученики'],
  ['Награды', 'Экспресс-выдача бейджей после тренировки'],
  ['Соревнования', 'Сбор заявок, категории, экспорт в Excel'],
  ['Оплаты', 'Статусы оплат без эквайринга'],
  ['Пояса', 'Прогресс и готовность к аттестации'],
  ['Напоминания', 'Дни рождения учеников'],
] as const

export function ForCoachesPage() {
  return (
    <div>
      <section className="gradient-hero px-5 py-16 text-white lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-green-light">Для тренеров</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight font-semibold tracking-tight">Кабинет на татами и за компьютером</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">
            Отметка посещаемости, выдача наград, контроль оплат, заявки на соревнования и аналитика по группам.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 pb-16 lg:px-8">
        <div className="relative z-10 -mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([title, text]) => (
            <div key={title} className="card-hover p-6">
              <h3 className="font-display text-lg font-semibold tracking-tight text-text">{title}</h3>
              <p className="mt-2 text-sm text-text-secondary">{text}</p>
            </div>
          ))}
        </div>

        <Link to="/login?role=coach" className="btn-coach mt-12 inline-block px-6 py-3">
          Войти как тренер
        </Link>
      </div>
    </div>
  )
}
