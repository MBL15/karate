import { Link, Navigate, useParams } from 'react-router-dom'
import { InfoPage } from '../components/layout/InfoPage'

const DOCUMENTS: Record<string, { title: string; sections: { heading: string; text: string }[] }> = {
  privacy: {
    title: 'Политика конфиденциальности',
    sections: [
      { heading: 'Какие данные мы храним', text: 'Имя, логин и (по желанию) email пользователя, данные ребёнка (имя, дата рождения), посещения, пояса, награды и статусы оплат.' },
      { heading: 'Кто видит данные', text: 'Данные ребёнка видят только его родители и тренер клуба. Публичных рейтингов и открытых профилей нет.' },
      { heading: 'Удаление', text: 'Чтобы удалить аккаунт и данные, напишите нам на info@karatehub.ru.' },
    ],
  },
  terms: {
    title: 'Условия использования',
    sections: [
      { heading: 'Сервис', text: 'Каратэ Хаб — приложение для тренеров и родителей каратэ-клубов. Сейчас работает бета-версия.' },
      { heading: 'Аккаунт', text: 'Пользователь отвечает за сохранность логина и пароля и за достоверность введённых данных.' },
      { heading: 'Оплата', text: 'Приложение показывает статусы оплаты занятий, но не принимает платежи.' },
    ],
  },
  consent: {
    title: 'Согласие на обработку данных',
    sections: [
      { heading: 'Что вы разрешаете', text: 'Регистрируясь, вы соглашаетесь на обработку своих данных и данных ребёнка для работы дневника и кабинета тренера.' },
      { heading: 'Отзыв согласия', text: 'Согласие можно отозвать в любой момент, написав на info@karatehub.ru.' },
    ],
  },
}

export function DocumentPage() {
  const { id = '' } = useParams()
  const doc = DOCUMENTS[id]
  if (!doc) return <Navigate to="/" replace />

  return (
    <InfoPage eyebrow="Документы" title={doc.title}>
      <div className="space-y-3">
        {doc.sections.map((s) => (
          <section key={s.heading} className="rounded-2xl border border-border-light bg-white p-5 shadow-[var(--shadow-card)]">
            <h2 className="font-semibold text-text">{s.heading}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{s.text}</p>
          </section>
        ))}
      </div>
      <p className="mt-6 text-xs text-text-muted">Краткая версия для бета-версии. Полный текст документа появится перед запуском.</p>
      <Link to="/" className="mt-4 inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← На главную
      </Link>
    </InfoPage>
  )
}
