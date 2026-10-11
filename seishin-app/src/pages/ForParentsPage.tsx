import { Link } from 'react-router-dom'
import { FeatureList, InfoPage } from '../components/layout/InfoPage'
import { IconActivity, IconAward, IconCalendar, IconFolder, IconTrophy, IconUsers } from '../components/ui/Icons'

const features = [
  { icon: <IconCalendar size={20} />, title: 'Расписание', text: 'Ближайшая тренировка и ответ тренеру: придёт ребёнок или нет' },
  { icon: <IconActivity size={20} />, title: 'Развитие', text: 'Посещения, серии без пропусков и путь спортсмена' },
  { icon: <IconAward size={20} />, title: 'Пояс и награды', text: 'Текущий пояс, готовность к аттестации и значки от тренера' },
  { icon: <IconTrophy size={20} />, title: 'События', text: 'Приглашения на турниры и аттестации, история участия' },
  { icon: <IconFolder size={20} />, title: 'Оплата занятий', text: 'Статус оплаты по месяцам' },
  { icon: <IconUsers size={20} />, title: 'Вся семья', text: 'Несколько детей в одном аккаунте и доступ для второго родителя' },
]

export function ForParentsPage() {
  return (
    <InfoPage
      eyebrow="Для родителей"
      title="Дневник вашего ребёнка"
      lead="Всё о тренировках и развитии ребёнка в одном месте. Данные видите только вы и тренер."
      tone="green"
    >
      <FeatureList items={features} tone="green" />
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/register" className="btn-primary px-6 py-3 text-center">
          Зарегистрироваться
        </Link>
        <Link to="/login?role=parent" className="btn-secondary px-6 py-3 text-center">
          Войти в дневник
        </Link>
      </div>
    </InfoPage>
  )
}
