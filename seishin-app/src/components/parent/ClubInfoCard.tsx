import { useEffect, useState, type ReactNode } from 'react'
import { parentApi } from '../../api/parent'
import type { ParentChildHome, ParentChildProfile } from '../../api/types'
import { childGroupName } from '../../utils/childGroup'
import { formatDate } from '../../utils/format'
import { beltTitle } from '../../utils/parentReadiness'
import { IconArrowRight, IconAward, IconCalendar, IconMapPin, IconUser, IconUsers } from '../ui/Icons'
import { BeltMark } from './ParentTopBar'

function Row({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 px-4 py-3.5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-green-light text-brand-green">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">{title}</p>
        <div className="mt-0.5 text-sm text-text">{children}</div>
      </div>
    </div>
  )
}

function Pending({ text }: { text: string }) {
  return <p className="text-sm text-text-muted">{text}</p>
}

const time = (value: string | null | undefined) => (value ? value.slice(0, 5) : '')

export function ClubInfoCard({ childId, childName, clubName }: { childId: number | null; childName: string; clubName: string }) {
  const [home, setHome] = useState<ParentChildHome | null>(null)
  const [club, setClub] = useState<ParentChildProfile | null>(null)
  const [groupName, setGroupName] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (childId == null) return
    let alive = true
    setHome(null)
    setClub(null)
    setGroupName(null)
    setFailed(false)
    Promise.all([parentApi.home(childId), parentApi.profile(childId), parentApi.history(childId).catch(() => [])])
      .then(([h, profile, history]) => {
        if (!alive) return
        setHome(h)
        setClub(profile)
        setGroupName(childGroupName(h.nextTraining?.groupName, history))
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [childId])

  const next = home?.nextTraining
  const displayName = club?.clubName || clubName
  const hallAddress = club?.clubAddress?.trim() || next?.location?.trim() || ''
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="card divide-y divide-border-light overflow-hidden p-0">
      <div className="flex items-center gap-4 px-4 py-4">
        {club?.clubLogo ? (
          <img src={club.clubLogo} alt="" className="size-14 shrink-0 rounded-2xl object-cover" />
        ) : (
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-green-light text-lg font-extrabold text-brand-green">
            {initials || '?'}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-text">{displayName}</p>
          <p className="text-xs text-text-secondary">{childName} занимается здесь</p>
        </div>
      </div>

      <Row icon={<IconUsers size={18} />} title="О клубе">
        {club?.clubDescription?.trim() ? (
          <p className="whitespace-pre-wrap">{club.clubDescription.trim()}</p>
        ) : (
          <Pending text="Тренер ещё не добавил описание клуба" />
        )}
      </Row>

      <Row icon={<IconCalendar size={18} />} title="Группа и тренировки">
        {groupName ? <p className="font-semibold">{groupName}</p> : <Pending text="Группа пока не назначена — уточните у тренера" />}
        {next && (
          <p className="mt-0.5 text-text-secondary">
            Следующая: {formatDate(next.date)}, {time(next.startTime)}
            {next.endTime ? `–${time(next.endTime)}` : ''}
          </p>
        )}
      </Row>

      <Row icon={<IconMapPin size={18} />} title="Адрес зала">
        {hallAddress ? <p className="font-semibold">{hallAddress}</p> : <Pending text="Адрес появится, когда тренер его укажет" />}
      </Row>

      <Row icon={<IconAward size={18} />} title="Система поясов">
        {home ? (
          <>
            <div className="flex flex-wrap items-center gap-2 font-semibold">
              <span className="flex items-center gap-1.5">
                <BeltMark color={home.beltColor} />
                {beltTitle(home.beltName)}
              </span>
              {!home.maxRank && home.nextBeltName && (
                <>
                  <IconArrowRight size={14} className="text-text-muted" />
                  <span className="flex items-center gap-1.5 text-text-secondary">
                    <BeltMark color={home.nextBeltColor} />
                    {beltTitle(home.nextBeltName)}
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-text-muted">
              {home.maxRank ? 'Высший пояс в системе клуба' : 'Текущий и следующий пояс. Полная лестница поясов клуба появится позже'}
            </p>
          </>
        ) : (
          <Pending text={failed ? 'Не удалось загрузить — откройте профиль ещё раз' : 'Загружаем…'} />
        )}
      </Row>

      <Row icon={<IconUser size={18} />} title="Тренер">
        {club?.coachName?.trim() ? <p className="font-semibold">{club.coachName.trim()}</p> : <Pending text="Имя тренера появится здесь" />}
      </Row>
    </div>
  )
}
