import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ChatMessage, UserRole } from '../../api/types'

type ChatPanelProps = {
  messages: ChatMessage[]
  loading: boolean
  sending: boolean
  error?: string | null
  onSend: (body: string) => Promise<void>
  emptyHint?: string
  viewerRole: UserRole
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function bubbleClass(mine: boolean, senderRole: UserRole, viewerRole: UserRole) {
  if (mine) {
    return viewerRole === 'COACH'
      ? 'ml-auto bg-brand-blue text-white'
      : 'ml-auto bg-brand-green text-white'
  }
  return senderRole === 'COACH'
    ? 'bg-brand-blue-light text-text'
    : 'bg-brand-green-light text-text'
}

export function ChatPanel({
  messages,
  loading,
  sending,
  error,
  onSend,
  emptyHint = 'Напишите первое сообщение',
  viewerRole,
}: ChatPanelProps) {
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const body = text.trim()
    if (!body || sending) return
    setText('')
    await onSend(body)
  }

  return (
    <div className="card flex min-h-[420px] flex-col overflow-hidden lg:min-h-[560px]">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 lg:p-5" role="log" aria-live="polite" aria-relevant="additions" aria-label="Сообщения">
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-12" role="status" aria-label="Загрузка сообщений">
            <div className="size-10 animate-pulse rounded-full bg-surface-muted" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-12 text-center">
            <p className="max-w-xs text-sm text-text-secondary">{emptyHint}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${bubbleClass(
                  message.mine,
                  message.senderRole,
                  viewerRole,
                )}`}
              >
                {!message.mine && (
                  <p className="mb-1 text-xs font-semibold opacity-80">{message.senderName}</p>
                )}
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                <p className={`mt-2 text-[10px] ${message.mine ? 'text-white/70' : 'text-text-muted'}`}>
                  {formatTime(message.sentAt)}
                </p>
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p role="alert" className="border-t border-border-light px-4 py-2 text-sm text-error lg:px-5">{error}</p>}

      <form onSubmit={submit} className="border-t border-border-light p-4 lg:p-5">
        <div className="flex gap-2">
          <label htmlFor="chat-message" className="sr-only">Сообщение</label>
          <input
            id="chat-message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Напишите сообщение…"
            className={viewerRole === 'COACH' ? 'input-coach flex-1' : 'input flex-1'}
            maxLength={2000}
            disabled={sending}
          />
          <button type="submit" disabled={sending || !text.trim()} className={viewerRole === 'COACH' ? 'btn-coach shrink-0' : 'btn-primary shrink-0'}>
            Отправить
          </button>
        </div>
      </form>
    </div>
  )
}
