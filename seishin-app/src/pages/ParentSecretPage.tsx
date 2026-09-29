import { Link } from 'react-router-dom'
import { ParentPageShell } from '../components/parent/ParentPageShell'
import { EmptyState } from '../components/ui/EmptyState'

export function ParentSecretPage() {
  return (
    <ParentPageShell title="Секретный раздел" subtitle="Скоро здесь появится что-то интересное">
      <EmptyState
        icon="🔒"
        title="Раздел в разработке"
        description="Вы нашли скрытую страницу. Пока здесь заглушка — функционал добавим позже."
        action={
          <Link to="/app" className="btn-primary">
            На главную
          </Link>
        }
      />
    </ParentPageShell>
  )
}
