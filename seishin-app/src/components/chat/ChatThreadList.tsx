import type { ChatSelection, ChatThread, UserRole } from '../../api/types'
import { formatThreadTime, selectionFromThread, selectionKey, threadKey } from './chatUtils'

type ChatThreadListProps = {
  threads: ChatThread[]
  selected: ChatSelection | null
  onSelect: (selection: ChatSelection) => void
  search: string
  onSearchChange: (value: string) => void
  viewerRole: UserRole
  onCreateGroup?: () => void
  emptyHint?: string
}

export function ChatThreadList({
  threads,
  selected,
  onSelect,
  search,
  onSearchChange,
  viewerRole,
  onCreateGroup,
  emptyHint = 'Ничего не найдено',
}: ChatThreadListProps) {
  const activeKey = selectionKey(selected)

  return (
    <div className="card flex flex-col overflow-hidden lg:max-h-[560px]">
      <div className="space-y-3 border-b border-border-light p-4">
        <div className="flex items-center gap-2">
          <label htmlFor="chat-search" className="sr-only">Поиск диалогов</label>
          <input
            id="chat-search"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск по имени или сообщению…"
            className={viewerRole === 'COACH' ? 'input-coach flex-1 py-2.5 text-sm' : 'input flex-1 py-2.5 text-sm'}
          />
          {onCreateGroup && (
            <button type="button" onClick={onCreateGroup} className="btn-coach shrink-0 px-3 py-2.5 text-sm">
              + Группа
            </button>
          )}
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {viewerRole === 'COACH' ? 'Диалоги' : 'Чаты'}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {threads.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-text-secondary">{emptyHint}</p>
        ) : (
          <ul>
            {threads.map((thread) => {
              const key = threadKey(thread)
              const active = activeKey === key
              const isGroup = thread.kind === 'GROUP'
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => onSelect(selectionFromThread(thread))}
                    aria-current={active ? 'true' : undefined}
                    className={`min-h-11 w-full border-b border-border-light px-4 py-4 text-left transition last:border-b-0 ${
                      active ? 'bg-brand-blue-light' : 'hover:bg-surface-muted'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {isGroup && (
                        <span className="mt-0.5 rounded-md bg-brand-blue/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-blue">
                          Группа
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-text">{thread.title}</p>
                        <p className="mt-0.5 text-xs text-text-secondary">{thread.subtitle}</p>
                        {thread.lastMessage ? (
                          <>
                            <p className="mt-2 line-clamp-2 text-sm text-text-secondary">{thread.lastMessage}</p>
                            <p className="mt-1 text-[10px] text-text-muted">{formatThreadTime(thread.lastMessageAt)}</p>
                          </>
                        ) : (
                          <p className="mt-2 text-sm text-text-muted">Нет сообщений</p>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
