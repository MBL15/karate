import { Link } from 'react-router-dom'
import { InfoPage } from '../components/layout/InfoPage'

export function NotFoundPage() {
  return (
    <InfoPage eyebrow="Ошибка 404" title="Страница не найдена" lead="Возможно, ссылка устарела или в адресе опечатка.">
      <Link to="/" className="btn-coach inline-flex min-h-12 items-center justify-center px-6">
        На главную
      </Link>
    </InfoPage>
  )
}
