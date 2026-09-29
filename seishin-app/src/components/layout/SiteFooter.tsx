import { Link } from 'react-router-dom'
import { BrandMark } from '../ui/BrandMark'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface-muted">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:px-8 md:grid-cols-3">
        <div>
          <BrandMark variant="site" size="md" showLabel />
          <p className="mt-4 text-sm leading-relaxed text-text-secondary">
            Цифровая платформа для каратэ-клуба: дневник родителя, кабинет тренера, соревнования и прогресс учеников.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text">Разделы</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link to="/for-parents" className="text-text-secondary transition hover:text-brand-green">
                Дневник родителя
              </Link>
            </li>
            <li>
              <Link to="/for-coaches" className="text-text-secondary transition hover:text-brand-green">
                Кабинет тренера
              </Link>
            </li>
            <li>
              <Link to="/login" className="text-text-secondary transition hover:text-brand-green">
                Вход в систему
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text">Контакты</p>
          <p className="mt-4 text-sm text-text-secondary">Москва · Основной зал</p>
          <p className="mt-1 text-sm text-text-secondary">info@karatehub.ru</p>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-text-muted">
        © {new Date().getFullYear()} Karate Hub
      </div>
    </footer>
  )
}
