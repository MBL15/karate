import { Link } from 'react-router-dom'
import { CoachPageShell } from '../../components/coach/CoachPageShell'
import { EmptyState } from '../../components/ui/EmptyState'

export function CoachSecretPage() {
  return (
    <CoachPageShell title="Секретный раздел" subtitle="Скоро здесь появится что-то интересное">
      <EmptyState
        icon="🔒"
        title="Раздел в разработке"
        description="Вы нашли скрытую страницу. Пока здесь заглушка — функционал добавим позже."
        action={
          <Link to="/coach" className="btn-coach">
            На главную
          </Link>
        }
      />
    </CoachPageShell>
  )
}
