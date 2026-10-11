import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ParentHero } from '../components/parent/ParentHero'
import { ParentPageShell } from '../components/parent/ParentPageShell'
import { ChildAvatar } from '../components/parent/ChildAvatar'
import { ClubInfoCard } from '../components/parent/ClubInfoCard'
import { useAuth } from '../context/AuthContext'
import { useParentChild } from '../context/ParentChildContext'
import { LogoutButton } from '../components/auth/LogoutButton'
import { SecondParentSheet } from '../components/parent/SecondParentSheet'
import { ParentSettingsSheet } from '../components/parent/ParentSettingsSheet'
import { IconChevronRight, IconFolder, IconPlus, IconSettings, IconUsers } from '../components/ui/Icons'
import { useParentProfile } from '../hooks/useParentProfile'
import { ageText } from '../utils/format'
import { beltTitle } from '../utils/parentReadiness'

function kidsWord(n: number) {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'ребёнок'
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'ребёнка'
  return 'детей'
}

const SECTION = 'mb-2 px-1 text-xs font-bold uppercase tracking-wider text-text-muted'

export function ChildProfile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { children, selectedChildId, setSelectedChildId, setAddChildOpen, groups, clubs, loading: childrenLoading } = useParentChild()
  const [clubChildId, setClubChildId] = useState<number | null>(null)
  const [secondParentOpen, setSecondParentOpen] = useState(false)
  const clubChild = clubChildId != null && children.some((c) => c.id === clubChildId) ? clubChildId : selectedChildId
  const clubKid = children.find((c) => c.id === clubChild) ?? null

  const { profile: parentData, fullName: parentName } = useParentProfile()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const contact = parentData.phone || parentData.email || (user?.login ? `Логин: ${user.login}` : '')
  const childrenLabel =
    childrenLoading && children.length === 0
      ? 'Загружаем…'
      : children.length === 0
        ? 'Дети пока не добавлены'
        : `${children.length} ${kidsWord(children.length)}`

  const openChild = (id: number) => {
    setSelectedChildId(id)
    navigate('/app/athlete')
  }

  return (
    <ParentPageShell
      title="Профиль"
      subtitle={parentName}
      hero={
        <ParentHero title="Профиль">
          <div className="mt-4 flex items-center gap-4 rounded-2xl border border-border-light bg-white p-4 shadow-[var(--shadow-card)]">
            <ChildAvatar photoKey="parent-photo" name={parentName} size={64} editable />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-text">{parentName}</p>
              <p className="text-sm text-text-secondary">Родитель · {childrenLabel}</p>
              {contact && <p className="mt-0.5 truncate text-xs text-text-muted">{contact}</p>}
            </div>
          </div>
        </ParentHero>
      }
    >
      <section>
        <p className={SECTION}>Мои дети</p>
        <div className="card divide-y divide-border-light overflow-hidden p-0">
          {children.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => openChild(child.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-muted"
            >
              <ChildAvatar childId={child.id} name={`${child.firstName} ${child.lastName}`} size={40} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-text">
                  {child.firstName} {child.lastName}
                </span>
                <span className="block truncate text-xs text-text-secondary">
                  {ageText(child.age)} · {beltTitle(child.beltName)}
                </span>
                {child.id in groups && (
                  <span className={`block truncate text-xs ${groups[child.id] ? 'font-semibold text-text' : 'text-text-muted'}`}>
                    {groups[child.id] ? `Группа: ${groups[child.id]}` : 'Группа не назначена'}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-xs font-semibold text-brand-green">Спортсмен</span>
              <IconChevronRight size={16} className="shrink-0 text-text-muted" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAddChildOpen(true)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-brand-green transition hover:bg-surface-muted"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-brand-green-light">
              <IconPlus size={18} />
            </span>
            Добавить ребёнка по коду
          </button>
          {children.length > 0 && (
            <button
              type="button"
              onClick={() => setSecondParentOpen(true)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-muted"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-green-light text-brand-green">
                <IconUsers size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-brand-green">Пригласить второго родителя</span>
                <span className="block text-xs text-text-secondary">Папа или мама — со своего телефона</span>
              </span>
              <IconChevronRight size={16} className="shrink-0 text-text-muted" />
            </button>
          )}
        </div>
      </section>
      <SecondParentSheet open={secondParentOpen} onClose={() => setSecondParentOpen(false)} kids={children} />

      {children.length > 0 && (
        <section>
          <p className={SECTION}>Клуб</p>
          {children.length > 1 && (
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Чей клуб показать">
              {children.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  role="tab"
                  aria-selected={child.id === clubChild}
                  onClick={() => setClubChildId(child.id)}
                  className={`min-h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition ${
                    child.id === clubChild ? 'bg-brand-green text-white' : 'bg-white text-text-secondary ring-1 ring-border-light'
                  }`}
                >
                  {child.firstName}
                </button>
              ))}
            </div>
          )}
          {clubKid && <ClubInfoCard key={clubKid.id} childId={clubKid.id} childName={clubKid.firstName} clubName={clubs[clubKid.id] ?? 'Клуб'} />}
        </section>
      )}

      <section className="max-w-lg">
        <p className={SECTION}>Аккаунт</p>
        <div className="card divide-y divide-border-light overflow-hidden p-0">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-muted"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-green-light text-brand-green">
              <IconSettings size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-text">Настройки профиля</span>
              <span className="block text-xs text-text-secondary">Фото, имя, телефон, почта, пароль</span>
            </span>
            <IconChevronRight size={16} className="shrink-0 text-text-muted" />
          </button>
          <Link to="/app/payments" className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-muted">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-green-light text-brand-green">
              <IconFolder size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-text">Оплата занятий</span>
              <span className="block text-xs text-text-secondary">Отметки тренера: оплачен месяц или нет</span>
            </span>
            <IconChevronRight size={16} className="shrink-0 text-text-muted" />
          </Link>
        </div>
        <ParentSettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <div className="mt-4">
          <LogoutButton />
        </div>
      </section>
    </ParentPageShell>
  )
}
