import { useCallback, useEffect, useState } from 'react'

import { coachApi } from '../../api/coach'

import type { ChatMessage, ChatSelection, ChatThread } from '../../api/types'

import { ApiError } from '../../api/client'

import { ChatPanel } from '../../components/chat/ChatPanel'

import { ChatThreadList } from '../../components/chat/ChatThreadList'

import { CreateGroupChatModal } from '../../components/chat/CreateGroupChatModal'

import { isSameSelection, selectionKey } from '../../components/chat/chatUtils'

import { CoachPageShell } from '../../components/coach/CoachPageShell'

import { CoachError, CoachLoading } from '../../components/coach/CoachScreenState'



export function CoachChatPage() {

  const [threads, setThreads] = useState<ChatThread[]>([])

  const [selected, setSelected] = useState<ChatSelection | null>(null)

  const [search, setSearch] = useState('')

  const [messages, setMessages] = useState<ChatMessage[]>([])

  const [loadingThreads, setLoadingThreads] = useState(true)

  const [loadingMessages, setLoadingMessages] = useState(false)

  const [sending, setSending] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)



  const loadThreads = useCallback(async () => {

    try {

      const list = await coachApi.chatThreads(search)

      setThreads(list)

      setSelected((prev) => {

        if (prev && list.some((thread) => selectionKey(prev) === (thread.kind === 'GROUP' ? `group-${thread.groupId}` : `student-${thread.studentId}`))) {

          return prev

        }

        return list[0] ? (list[0].kind === 'GROUP' ? { kind: 'GROUP', groupId: list[0].groupId! } : { kind: 'STUDENT', studentId: list[0].studentId! }) : null

      })

      setError(null)

    } catch (e) {

      setError(e instanceof ApiError ? e.message : 'Не удалось загрузить диалоги')

    } finally {

      setLoadingThreads(false)

    }

  }, [search])



  const loadMessages = useCallback(async () => {

    if (!selected) {

      setMessages([])

      return

    }

    setLoadingMessages(true)

    try {

      const list =

        selected.kind === 'GROUP'

          ? await coachApi.groupMessages(selected.groupId)

          : await coachApi.messages(selected.studentId)

      setMessages(list)

      setError(null)

    } catch (e) {

      setError(e instanceof ApiError ? e.message : 'Не удалось загрузить сообщения')

    } finally {

      setLoadingMessages(false)

    }

  }, [selected])



  useEffect(() => {

    setLoadingThreads(true)

    const timer = window.setTimeout(() => void loadThreads(), search ? 300 : 0)

    return () => window.clearTimeout(timer)

  }, [loadThreads, search])



  useEffect(() => {

    const timer = window.setInterval(() => void loadThreads(), 10000)

    return () => window.clearInterval(timer)

  }, [loadThreads])



  useEffect(() => {

    void loadMessages()

    if (!selected) return

    const timer = window.setInterval(() => void loadMessages(), 5000)

    return () => window.clearInterval(timer)

  }, [loadMessages, selected])



  const send = async (body: string) => {

    if (!selected) return

    setSending(true)

    setError(null)

    try {

      const message =

        selected.kind === 'GROUP'

          ? await coachApi.sendGroupMessage(selected.groupId, body)

          : await coachApi.sendMessage(selected.studentId, body)

      setMessages((prev) => [...prev, message])

      void loadThreads()

    } catch (e) {

      setError(e instanceof ApiError ? e.message : 'Не удалось отправить сообщение')

    } finally {

      setSending(false)

    }

  }



  const selectedThread = threads.find((thread) =>

    isSameSelection(

      selected,

      thread.kind === 'GROUP' ? { kind: 'GROUP', groupId: thread.groupId! } : { kind: 'STUDENT', studentId: thread.studentId! },

    ),

  )



  const emptyHint =

    selectedThread?.kind === 'GROUP'

      ? 'Напишите участникам группового чата'

      : `Напишите родителю ученика ${selectedThread?.title ?? ''}`.trim()



  return (

    <CoachPageShell title="Чат" subtitle="Личные и групповые диалоги с родителями">

      {loadingThreads && threads.length === 0 ? (

        <CoachLoading />

      ) : error && threads.length === 0 ? (

        <CoachError message={error} />

      ) : (

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">

          <ChatThreadList

            threads={threads}

            selected={selected}

            onSelect={setSelected}

            search={search}

            onSearchChange={setSearch}

            viewerRole="COACH"

            onCreateGroup={() => setCreateOpen(true)}

            emptyHint={search ? 'По запросу ничего не найдено' : 'Пока нет диалогов'}

          />



          <div>

            {selectedThread && (

              <div className="mb-4 hidden rounded-2xl border border-border-light bg-surface px-5 py-4 lg:block">

                <p className="font-semibold text-text">{selectedThread.title}</p>

                <p className="text-sm text-text-secondary">{selectedThread.subtitle}</p>

              </div>

            )}

            {!selected ? (

              <CoachError message="Выберите диалог из списка" />

            ) : (

              <ChatPanel

                messages={messages}

                loading={loadingMessages}

                sending={sending}

                error={error}

                onSend={send}

                emptyHint={emptyHint}

                viewerRole="COACH"

              />

            )}

          </div>

        </div>

      )}



      <CreateGroupChatModal

        open={createOpen}

        onClose={() => setCreateOpen(false)}

        onCreated={() => void loadThreads()}

      />

    </CoachPageShell>

  )

}


