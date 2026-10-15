import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { coachApi } from '../../../api/coach'
import { ApiError } from '../../../api/client'
import { useCoachCreate } from '../../../components/coach/coachCreateContext'
import { BeltSystemsManager } from '../../../components/coach/tools/BeltSystemsManager'
import { GroupsManager } from '../../../components/coach/tools/GroupsManager'
import { SectionTitle, ToolCard, ToolShell } from '../../../components/coach/tools/ToolShell'
import { IconCheck, IconClipboard, IconMapPin, IconPlus } from '../../../components/ui/Icons'
import { PhotoCrop } from '../../../components/ui/PhotoCrop'

type ClubProfile = { name: string; description: string; address: string; logo: string | null }

const emptyProfile = (): ClubProfile => ({ name: '', description: '', address: '', logo: null })

function fromServer(saved: {
  name?: string | null
  description?: string | null
  address?: string | null
  logo?: string | null
}): ClubProfile {
  return {
    name: saved.name ?? '',
    description: saved.description ?? '',
    address: saved.address ?? '',
    logo: saved.logo ?? null,
  }
}

export function ClubTool() {
  const openCreate = useCoachCreate()
  const [profile, setProfile] = useState<ClubProfile>(emptyProfile)
  const [draft, setDraft] = useState<ClubProfile>(emptyProfile)
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [savedAt, setSavedAt] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [cropFile, setCropFile] = useState<File | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    Promise.all([coachApi.createInviteCode(), coachApi.clubProfile()])
      .then(([invite, remote]) => {
        if (!alive) return
        setCode(invite.code)
        const next = fromServer({ ...remote, name: remote.name ?? invite.clubName })
        setProfile(next)
        setDraft(next)
      })
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : 'Не удалось загрузить клуб'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const dirty = JSON.stringify(draft) !== JSON.stringify(profile)
  const clubName = profile.name || 'Ваш клуб'

  const copy = async () => {
    if (!code) return
    await navigator.clipboard.writeText(code).catch(() => undefined)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const onLogo = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) setCropFile(file)
  }

  const saveProfile = () => {
    void coachApi
      .clubProfileUpdate({
        name: draft.name.trim() || undefined,
        description: draft.description,
        address: draft.address,
        logo: draft.logo,
      })
      .then((saved) => {
        const next = fromServer(saved)
        setProfile(next)
        setDraft(next)
        setSavedAt(Date.now())
        setError(null)
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Не удалось сохранить'))
  }

  return (
    <ToolShell kind="club" title="Настройки клуба" subtitle="Профиль, пояса и группы">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] p-5 text-white shadow-[var(--shadow-blue)]">
        <span className="pointer-events-none absolute -top-10 -right-8 size-36 rounded-full bg-white/10" aria-hidden />
        <span className="pointer-events-none absolute -bottom-14 left-10 size-32 rounded-full bg-white/5" aria-hidden />
        <p className="text-sm font-medium text-white/80">Код для входа в клуб</p>
        {error && !loading ? (
          <p className="mt-2 text-sm">{error}</p>
        ) : (
          <p className="mt-1 font-display text-[2.4rem] font-bold tracking-[0.3em] tabular-nums">{code ?? '······'}</p>
        )}
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-white/75">
          Один код на весь клуб. Родитель вводит его при регистрации — ребёнок попадает в вашу секцию.
        </p>
        <div className="relative mt-4 flex gap-2">
          <button type="button" onClick={() => void copy()} disabled={!code} className="flex min-h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-brand-blue transition active:scale-95">
            {copied ? <IconCheck size={15} /> : <IconClipboard size={15} />}
            {copied ? 'Скопировано' : 'Копировать'}
          </button>
          <button type="button" onClick={() => openCreate('invite')} className="min-h-10 rounded-full bg-white/15 px-4 text-sm font-semibold text-white transition hover:bg-white/25 active:scale-95">
            Показать QR
          </button>
        </div>
      </section>

      <ToolCard>
        <SectionTitle>Профиль клуба</SectionTitle>
        {loading ? (
          <p className="text-sm text-text-muted">Загружаем профиль с сервера…</p>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="group relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-border bg-surface-muted transition hover:border-brand-blue"
                aria-label="Загрузить логотип"
              >
                {draft.logo ? (
                  <img src={draft.logo} alt="Логотип клуба" className="size-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center text-text-muted group-hover:text-brand-blue">
                    <IconPlus size={20} />
                    <span className="mt-0.5 text-[10px] font-semibold">Логотип</span>
                  </span>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onLogo(e)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold text-text">{draft.name || clubName}</p>
                <div className="mt-1 flex gap-3 text-xs font-semibold">
                  <button type="button" onClick={() => fileRef.current?.click()} className="text-brand-blue">
                    {draft.logo ? 'Заменить' : 'Загрузить'}
                  </button>
                  {draft.logo && (
                    <button type="button" onClick={() => setDraft({ ...draft, logo: null })} className="text-error">
                      Убрать
                    </button>
                  )}
                </div>
              </div>
            </div>

            <label className="mt-4 block text-sm font-medium text-text">
              Название
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Название клуба" className="input-coach mt-1.5" />
            </label>
            <label className="mt-3 block text-sm font-medium text-text">
              Описание
              <textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                rows={3}
                placeholder="Стиль, философия, для кого занятия"
                className="input-coach mt-1.5 resize-none"
              />
            </label>
            <label className="mt-3 block text-sm font-medium text-text">
              Адрес
              <span className="relative mt-1.5 block">
                <IconMapPin size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-muted" />
                <input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} placeholder="Город, улица, зал" className="input-coach pl-10" />
              </span>
            </label>
            {error && !loading && <p className="mt-3 text-sm text-error">{error}</p>}
            <button type="button" disabled={!dirty} onClick={saveProfile} className="btn-coach mt-4 min-h-12 w-full rounded-2xl">
              {savedAt && !dirty ? 'Сохранено' : 'Сохранить профиль'}
            </button>
          </>
        )}
      </ToolCard>

      <ToolCard>
        <SectionTitle>Системы поясов</SectionTitle>
        <BeltSystemsManager />
      </ToolCard>

      <ToolCard>
        <GroupsManager />
      </ToolCard>

      <p className="px-1 text-xs text-text-muted">Профиль клуба и системы поясов хранятся на сервере — родители видят описание и адрес в блоке «Клуб».</p>
      {cropFile && (
        <PhotoCrop
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onDone={(logo) => {
            setDraft((current) => ({ ...current, logo }))
            setCropFile(null)
          }}
        />
      )}
    </ToolShell>
  )
}
