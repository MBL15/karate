import { useEffect, useState } from 'react'
import { parentApi } from '../api/parent'
import type { Document, HistoryEntry, Payment } from '../api/types'
import { ApiError } from '../api/client'
import { ParentHero } from '../components/parent/ParentHero'
import { ParentPageShell } from '../components/parent/ParentPageShell'
import { ParentError, ParentLoading } from '../components/parent/ParentScreenState'
import { IconFolder } from '../components/ui/Icons'
import { useParentChild } from '../context/ParentChildContext'
import { attendanceDayClass, attendanceStatusLabel, formatDate, paymentStatusUi } from '../utils/format'

type Tab = 'history' | 'payments' | 'documents'

const tabs: { id: Tab; label: string }[] = [
  { id: 'history', label: 'Посещения' },
  { id: 'payments', label: 'Оплаты' },
  { id: 'documents', label: 'Документы' },
]

function ArchiveTabs({ tab, onChange, variant }: { tab: Tab; onChange: (tab: Tab) => void; variant: 'dark' | 'light' }) {
  const dark = variant === 'dark'

  return (
    <div role="tablist" aria-label="Разделы архива" className={`flex gap-2 overflow-x-auto ${dark ? '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : 'flex-wrap'}`}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={tab === t.id}
          onClick={() => onChange(t.id)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === t.id
              ? dark
                ? 'bg-white text-navy-950'
                : 'bg-brand-green text-white'
              : dark
                ? 'bg-white/10 text-white/80 hover:bg-white/15'
                : 'bg-surface-muted text-text-secondary hover:bg-brand-green-light hover:text-brand-green'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function HistoryDocuments() {
  const { selectedChild, selectedChildId } = useParentChild()
  const [tab, setTab] = useState<Tab>('history')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)

  useEffect(() => {
    if (!selectedChildId) return
    setLoading(true)
    Promise.all([
      parentApi.history(selectedChildId),
      parentApi.payments(selectedChildId),
      parentApi.documents(),
    ])
      .then(([h, p, d]) => {
        setHistory(h)
        setPayments(p)
        setDocuments(d)
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Ошибка'))
      .finally(() => setLoading(false))
  }, [selectedChildId])

  const presentCount = history.filter((h) => h.status === 'PRESENT' || h.status === 'MAKEUP').length
  const total = history.length || 1
  const attendancePct = Math.round((presentCount / total) * 100)
  const subtitle = selectedChild
    ? `${selectedChild.firstName} · посещения, оплаты и документы`
    : 'Посещения, оплаты и документы'

  return (
    <ParentPageShell
      title="Архив"
      subtitle={subtitle}
      childSwitcher
      hero={
        <ParentHero eyebrow="Дневник" title="Архив" subtitle={subtitle} childSwitcher>
          <div className="mt-6">
            <ArchiveTabs tab={tab} onChange={setTab} variant="dark" />
          </div>
        </ParentHero>
      }
    >
      <div className="hidden lg:block">
        <ArchiveTabs tab={tab} onChange={setTab} variant="light" />
      </div>

      {loading ? (
        <ParentLoading />
      ) : error ? (
        <ParentError message={error} />
      ) : tab === 'history' ? (
        <div className="space-y-4">
          <div className="card p-5 lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="font-bold text-text">Посещаемость</p>
              <span className="badge-success">
                {presentCount} из {history.length || 0} · {history.length ? attendancePct : 0}%
              </span>
            </div>
            {history.length > 0 ? (
              <>
                <div className="mt-4 flex flex-wrap gap-2">
                  {history.map((entry, index) => {
                    const day = new Date(`${entry.date}T12:00:00`).getDate()
                    return (
                      <div
                        key={`${entry.date}-${entry.groupName}-${index}`}
                        title={`${formatDate(entry.date)} · ${entry.groupName}: ${attendanceStatusLabel(entry.status)}`}
                        className={`flex size-9 items-center justify-center rounded-xl text-xs font-semibold lg:size-10 ${attendanceDayClass(entry.status)}`}
                      >
                        {day}
                      </div>
                    )
                  })}
                </div>
                <p className="mt-4 text-xs text-text-muted">
                  Зелёный — был или отработка, красный — пропуск, жёлтый — гость
                </p>
              </>
            ) : (
              <p className="mt-4 text-sm text-text-secondary">
                Записей пока нет. После отметки тренером занятия данные появятся здесь.
              </p>
            )}
          </div>

          {history.length > 0 && (
            <ul className="grid gap-3">
              {history.map((entry, index) => (
                <li key={`${entry.date}-${entry.groupName}-${index}-row`} className="card flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-text">{formatDate(entry.date)}</p>
                    <p className="mt-0.5 truncate text-sm text-text-secondary">{entry.groupName}</p>
                  </div>
                  <span className={`badge shrink-0 ${attendanceDayClass(entry.status).includes('d94b55') ? 'badge-error' : entry.status === 'GUEST' ? 'badge-warning' : 'badge-success'}`}>
                    {attendanceStatusLabel(entry.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : tab === 'payments' ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {payments.map((p) => {
            const ui = paymentStatusUi(p.status, p.dueDate)
            return (
              <div key={p.id} className="card flex items-center justify-between p-5">
                <div>
                  <p className="font-semibold text-text">{p.periodLabel}</p>
                  <p className="text-sm text-text-secondary">{p.description}</p>
                  <p className="mt-1 text-lg font-bold">{p.amount.toLocaleString('ru-RU')} ₽</p>
                </div>
                <span className={`badge ${ui.className.includes('d94b55') ? 'badge-error' : ui.className.includes('d7a62a') ? 'badge-warning' : 'badge-success'}`}>
                  {ui.label}
                </span>
              </div>
            )
          })}
          {payments.length === 0 && (
            <div className="card p-8 text-center text-sm text-text-secondary lg:col-span-2">Оплат пока нет</div>
          )}
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {documents.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => setSelectedDoc(doc)}
              className="card flex w-full items-center gap-3 p-5 text-left transition hover:bg-surface-muted"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-green-light text-brand-green">
                <IconFolder size={18} />
              </span>
              <span className="font-semibold text-text">{doc.title}</span>
            </button>
          ))}
          {selectedDoc && (
            <div className="card p-5 text-sm leading-relaxed text-text lg:col-span-2">
              <p className="mb-3 font-bold">{selectedDoc.title}</p>
              <pre className="whitespace-pre-wrap font-sans">{selectedDoc.content}</pre>
            </div>
          )}
        </div>
      )}
    </ParentPageShell>
  )
}
