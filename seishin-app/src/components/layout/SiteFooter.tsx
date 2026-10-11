import { Link } from 'react-router-dom'

const documents = [
  { to: '/docs/privacy', label: 'Политика конфиденциальности' },
  { to: '/docs/terms', label: 'Условия использования' },
  { to: '/docs/consent', label: 'Согласие на обработку данных' },
]

const info = [
  { to: '/for-parents', label: 'Для родителей' },
  { to: '/for-coaches', label: 'Для тренеров' },
  { to: '/login', label: 'Вход в кабинет' },
]

function LinkGroup({ title, items }: { title: string; items: { to: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <p className="text-xs font-semibold uppercase tracking-wider text-text">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm">
        {items.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="text-text-secondary transition hover:text-brand-blue">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function SiteFooter() {
  return (
    <footer id="site-footer" className="border-t border-border bg-surface-muted">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-3 lg:px-8">
        <LinkGroup title="Документы" items={documents} />
        <LinkGroup title="Информация" items={info} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text">Контакты</p>
          <ul className="mt-4 space-y-2.5 text-sm text-text-secondary">
            <li>
              <a href="mailto:info@karatehub.ru" className="transition hover:text-brand-blue">
                info@karatehub.ru
              </a>
            </li>
            <li>Москва</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-text-muted">
        © {new Date().getFullYear()} Каратэ Хаб · Бета-версия
      </div>
    </footer>
  )
}
