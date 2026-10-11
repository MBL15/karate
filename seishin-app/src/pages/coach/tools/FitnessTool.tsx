import { useCallback, useState } from 'react'
import { ToolShell } from '../../../components/coach/tools/ToolShell'
import { unlockAudio } from '../../../utils/sound'
import { BuildScreen } from './fitness/BuildScreen'
import { DAY_COMPLEX } from './fitness/dayComplex'
import { EXERCISES, type Category } from './fitness/exercises'
import { categoryLabels, generateWorkout, type Minutes, type Workout } from './fitness/generator'
import { plural } from './fitness/format'
import { ResultScreen } from './fitness/ResultScreen'
import { RunScreen } from './fitness/RunScreen'
import { ThinkingScreen } from './fitness/ThinkingScreen'

type Screen = 'build' | 'thinking' | 'result' | 'day'

export function FitnessTool() {
  const [screen, setScreen] = useState<Screen>('build')
  const [categories, setCategories] = useState<Category[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [minutes, setMinutes] = useState<Minutes>(10)
  const [error, setError] = useState<string | null>(null)
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [pending, setPending] = useState<{ workout: Workout; messages: string[] } | null>(null)
  const [running, setRunning] = useState(false)

  const scrollTop = () => {
    window.scrollTo({ top: 0 })
    document.getElementById('main-content')?.scrollTo({ top: 0 })
  }

  const launch = (cats: Category[], ids: string[], mins: Minutes) => {
    const valid = ids.filter((id) => cats.includes(EXERCISES.find((e) => e.id === id)?.category as Category))
    if (cats.length === 0 || valid.length === 0) {
      setError('Выберите хотя бы одну группу мышц и одно упражнение.')
      return
    }
    setError(null)
    const result = generateWorkout({ categories: cats, exerciseIds: valid, minutes: mins, seed: Date.now() })
    const messages = [
      `Анализирую группы мышц: ${categoryLabels(cats)}`,
      `Оцениваю сложность ${valid.length} ${plural(valid.length, 'упражнения', 'упражнений', 'упражнений')}`,
      result.insights[0] ?? 'Выстраиваю порядок упражнений',
      'Подбираю подходы, повторения и отдых',
      `Укладываю комплекс в ${mins} минут`,
      'Добавляю заминку в конце',
    ]
    setPending({ workout: result, messages })
    setScreen('thinking')
    scrollTop()
  }

  const finishThinking = useCallback(() => {
    if (pending) setWorkout(pending.workout)
    setPending(null)
    setScreen('result')
  }, [pending])

  const toggleCategory = (c: Category) => {
    setError(null)
    if (categories.includes(c)) {
      setCategories(categories.filter((x) => x !== c))
      setSelected(selected.filter((id) => EXERCISES.find((e) => e.id === id)?.category !== c))
    } else {
      setCategories([...categories, c])
    }
  }

  const selectAll = (c: Category) => {
    const ids = EXERCISES.filter((e) => e.category === c).map((e) => e.id)
    const all = ids.every((id) => selected.includes(id))
    setSelected(all ? selected.filter((id) => !ids.includes(id)) : [...new Set([...selected, ...ids])])
  }

  const randomize = () => {
    if (categories.length === 0) return
    setError(null)
    const total = { 5: 3, 10: 5, 15: 6 }[minutes]
    const perCategory = Math.max(2, Math.round(total / categories.length))
    const roll = () =>
      categories.flatMap((c) =>
        EXERCISES.filter((e) => e.category === c)
          .map((e) => ({ id: e.id, r: Math.random() }))
          .sort((a, b) => a.r - b.r)
          .slice(0, perCategory)
          .map((e) => e.id),
      )
    const same = (ids: string[]) => ids.length === selected.length && ids.every((id) => selected.includes(id))
    let next = roll()
    for (let i = 0; i < 5 && same(next); i++) next = roll()
    setSelected(next)
  }

  const subtitle =
    screen === 'day'
      ? `Комплекс дня · ${DAY_COMPLEX.author.name}`
      : screen === 'result' && workout
        ? `${categoryLabels([...new Set(workout.items.map((i) => i.exercise.category))].sort() as Category[])} · ${workout.minutes} минут`
        : 'Комплекс за 30 секунд'
  const activeWorkout = screen === 'day' ? DAY_COMPLEX.workout : workout

  return (
    <ToolShell
      kind="fitness"
      title="Конструктор ОФП"
      subtitle={subtitle}
      onBack={screen === 'result' || screen === 'day' ? () => setScreen('build') : undefined}
      backLabel={screen === 'day' ? 'Назад' : 'К выбору упражнений'}
    >
      {screen === 'build' && (
        <BuildScreen
          categories={categories}
          selected={selected}
          minutes={minutes}
          error={error}
          onToggleCategory={toggleCategory}
          onToggleExercise={(id) => {
            setError(null)
            setSelected((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))
          }}
          onSelectAll={selectAll}
          onRandomize={randomize}
          onMinutes={setMinutes}
          onGenerate={() => launch(categories, selected, minutes)}
          onTryDay={() => {
            setScreen('day')
            scrollTop()
          }}
        />
      )}

      {screen === 'day' && (
        <ResultScreen
          workout={DAY_COMPLEX.workout}
          author={DAY_COMPLEX.author}
          onStart={() => {
            unlockAudio()
            setRunning(true)
          }}
        />
      )}

      {screen === 'thinking' && pending && <ThinkingScreen messages={pending.messages} onDone={finishThinking} />}

      {screen === 'result' && workout && (
        <ResultScreen
          workout={workout}
          onStart={() => {
            unlockAudio()
            setRunning(true)
          }}
          onRegenerate={() => launch(categories, selected, minutes)}
          onEdit={() => setScreen('build')}
        />
      )}

      {running && activeWorkout && <RunScreen workout={activeWorkout} onExit={() => setRunning(false)} />}
    </ToolShell>
  )
}
