import { useCallback, useEffect, useState } from 'react'

import { parentApi } from '../api/parent'

import type { ChatMessage, ChatSelection, ChatThread } from '../api/types'

import { ApiError } from '../api/client'

import { ChatPanel } from '../components/chat/ChatPanel'

import { ChatThreadList } from '../components/chat/ChatThreadList'

import { isSameSelection, selectionKey } from '../components/chat/chatUtils'

import { ParentPageShell } from '../components/parent/ParentPageShell'

import { ParentError } from '../components/parent/ParentScreenState'



export function ParentChatPage() {

  const [threads, setThreads] = useState<ChatThread[]>([])

  const [selected, setSelected] = useState<ChatSelection | null>(null)

  const [search, setSearch] = useState('')

  const [messages, setMessages] = useState<ChatMessage[]>([])

  const [loadingThreads, setLoadingThreads] = useState(true)

  const [loadingMessages, setLoadingMessages] = useState(false)

  const [sending, setSending] = useState(false)

  const [error, setError] = useState<string | null>(null)



  const loadThreads = useCallback(async () => {

    try {

      const list = await parentApi.chatThreads(search)

      setThreads(list)

      setSelected((prev) => {

        if (prev && list.some((thread) => selectionKey(prev) === (thread.kind === 'GROUP' ? `group-${thread.groupId}` : `student-${thread.studentId}`))) {

          return prev

        }

        return list[0] ? (list[0].kind === 'GROUP' ? { kind: 'GROUP', groupId: list[0].groupId! } : { kind: 'STUDENT', studentId: list[0].studentId! }) : null

      })

      setError(null)

    } catch (e) {

      setError(e instanceof ApiError ? e.message : 'Не удалось загрузить чаты')

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

          ? await parentApi.groupMessages(selected.groupId)

          : await parentApi.messages(selected.studentId)

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

          ? await parentApi.sendGroupMessage(selected.groupId, body)

          : await parentApi.sendMessage(selected.studentId, body)

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



  const subtitle = selectedThread

    ? selectedThread.kind === 'GROUP'

      ? `${selectedThread.title} · групповой чат`

      : `${selectedThread.title} · переписка с тренером`

    : 'Выберите чат'



  const emptyHint =

    selectedThread?.kind === 'GROUP'

      ? 'Напишите в групповой чат'

      : 'Напишите тренеру — ответ появится здесь'



  return (

    <ParentPageShell

      title="Чат"

      subtitle={subtitle}

      hero={

        <div className="rounded-b-[2.5rem] bg-navy-950 px-5 pb-12 pt-5 shadow-lg">

          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Связь с тренером</p>

          <h2 className="mt-2 text-2xl font-extrabold text-white">Чат</h2>

          <p className="mt-1 text-sm text-white/70">{subtitle}</p>

        </div>

      }

    >

      {loadingThreads && threads.length === 0 ? (

        <div className="flex justify-center py-16">

          <div className="size-10 animate-pulse rounded-full bg-surface-muted" />

        </div>

      ) : error && threads.length === 0 ? (

        <ParentError message={error} />

      ) : threads.length === 0 ? (

        <ParentError message="Пока нет доступных чатов" />

      ) : (

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">

          <ChatThreadList

            threads={threads}

            selected={selected}

            onSelect={setSelected}

            search={search}

            onSearchChange={setSearch}

            viewerRole="PARENT"

            emptyHint={search ? 'По запросу ничего не найдено' : 'Нет чатов'}

          />



          <div>

            {!selected ? (

              <ParentError message="Выберите чат из списка" />

            ) : (

              <ChatPanel

                messages={messages}

                loading={loadingMessages}

                sending={sending}

                error={error}

                onSend={send}

                emptyHint={emptyHint}

                viewerRole="PARENT"

              />

            )}

          </div>

        </div>

      )}

    </ParentPageShell>

  )

}


