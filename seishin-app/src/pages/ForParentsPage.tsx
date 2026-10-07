import { Link } from 'react-router-dom'

export function ForParentsPage() {
  return (
    <div>
      <section className="gradient-hero px-5 py-16 text-white lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-green-light">Для родителей</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl leading-tight font-semibold tracking-tight">Дневник вашего ребёнка</h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/75">
            Следите за тренировками, поясами, наградами и соревнованиями. Только ваш ребёнок — без публичных рейтингов.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 pb-16 lg:px-8">
        <div className="relative z-10 -mt-10 grid items-start gap-12 lg:grid-cols-2">
          <div className="card p-8">
            <ul className="space-y-4">
              {[
                'Переключение между детьми в одном аккаунте',
                'Ответ на приглашения на соревнования с указанием веса',
                'История посещений, оплат и документов',
                'Комментарии тренера и прогресс к аттестации',
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm text-text">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-green-light text-xs text-brand-green">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/login?role=parent" className="btn-primary mt-8 inline-block px-6 py-3">
              Открыть дневник
            </Link>
          </div>
          <div className="flex justify-center">
            <div className="w-full max-w-[390px] overflow-hidden rounded-[2rem] bg-page shadow-[var(--shadow-elevated)]">
              <div className="bg-navy-950 px-5 pb-10 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Текущий уровень</p>
                <p className="mt-2 text-2xl font-extrabold text-white">Белый пояс</p>
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-white/80">Прогресс до жёлтого</span>
                    <span className="font-bold text-brand-green">72%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-navy-900">
                    <div className="h-full w-[72%] rounded-full bg-brand-green" />
                  </div>
                </div>
              </div>
              <div className="-mt-6 grid grid-cols-2 gap-3 px-4 pb-5">
                <div className="card p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Оплата</p>
                  <p className="mt-1 text-sm font-bold">Оплачено</p>
                </div>
                <div className="card p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Профиль</p>
                  <p className="mt-1 text-sm font-bold">Михаил</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
