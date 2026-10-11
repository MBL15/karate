import { Link } from 'react-router-dom'
import { FeatureList, InfoPage } from '../components/layout/InfoPage'
import { IconAward, IconCalendar, IconCheck, IconClipboard, IconTrophy, IconUsers } from '../components/ui/Icons'

const features = [
  { icon: <IconCheck size={20} />, title: 'Посещаемость', text: 'Отметка группы в пару касаний прямо на тренировке' },
  { icon: <IconCalendar size={20} />, title: 'Расписание', text: 'Регулярные тренировки и календарь клуба' },
  { icon: <IconUsers size={20} />, title: 'Группы и ученики', text: 'База учеников и приглашение родителей по коду' },
  { icon: <IconAward size={20} />, title: 'Пояса и значки', text: 'Системы поясов по стилям и награды после тренировки' },
  { icon: <IconTrophy size={20} />, title: 'Турниры и аттестации', text: 'Приглашения родителям, ответы и итоги' },
  { icon: <IconClipboard size={20} />, title: 'Инструменты', text: 'Журнал месяца, физподготовка, планы и аналитика' },
]

export function ForCoachesPage() {
  return (
    <InfoPage
      eyebrow="Для тренеров"
      title="Кабинет тренера"
      lead="Меньше рутины — больше времени на тренировки и развитие спортсменов."
    >
      <FeatureList items={features} />
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/register" className="btn-coach px-6 py-3 text-center">
          Создать кабинет
        </Link>
        <Link to="/login?role=coach" className="btn-secondary px-6 py-3 text-center">
          Войти как тренер
        </Link>
      </div>
    </InfoPage>
  )
}
