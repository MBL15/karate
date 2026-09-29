import { Link } from 'react-router-dom'

const screens = [
  { path: '/coach', label: 'Кабинет тренера', type: 'desktop' },
  { path: '/parent', label: 'Дневник родителя — главная', type: 'mobile' },
  { path: '/profile', label: 'Профиль ребёнка', type: 'mobile' },
  { path: '/achievements', label: 'Достижения ребёнка', type: 'mobile' },
  { path: '/competition', label: 'Приглашение на соревнование', type: 'mobile' },
  { path: '/history', label: 'История и документы', type: 'mobile' },
]

export function Gallery() {
  return (
    <div className="min-h-screen bg-[#102c53] px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9cb0cc]">
          Karate Hub · Каратэ-клуб
        </p>
        <h1 className="mt-2 text-4xl font-bold">Макеты из Figma</h1>
        <p className="mt-3 text-[#b8c5d8]">
          Выберите экран для просмотра реализации дизайна.
        </p>
        <div className="mt-10 grid gap-3">
          {screens.map((screen) => (
            <Link
              key={screen.path}
              to={screen.path}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 transition hover:bg-white/10"
            >
              <span className="font-semibold">{screen.label}</span>
              <span className="text-xs text-[#9cb0cc]">
                {screen.type === 'desktop' ? '1440px' : '390px'}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
