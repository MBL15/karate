import { ToolShell } from '../../../components/coach/tools/ToolShell'
import { IconLock } from '../../../components/ui/Icons'

const DOCUMENTS = [
  { title: 'Договор на оказание услуг', text: 'Между клубом и родителем ученика', category: 'Договоры' },
  { title: 'Согласие на обработку персональных данных', text: 'По 152-ФЗ для родителя и ребёнка', category: 'Согласия' },
  { title: 'Информированное согласие на занятия', text: 'Риски, правила зала, ответственность', category: 'Согласия' },
  { title: 'Согласие на фото- и видеосъёмку', text: 'Для соцсетей и сайта клуба', category: 'Согласия' },
  { title: 'Заявление о приёме в секцию', text: 'Анкета ученика и контакты', category: 'Заявления' },
  { title: 'Положение о соревнованиях', text: 'Шаблон для турнира клуба', category: 'Положения' },
  { title: 'Протокол аттестации', text: 'Результаты сдачи на пояс', category: 'Протоколы' },
]

export function DocumentsTool() {
  return (
    <ToolShell kind="documents" title="Документы" subtitle="Шаблоны юридических документов клуба">
      <div className="rounded-3xl bg-gradient-to-br from-[#f1ebff] to-[#e9e0ff] p-5">
        <p className="text-sm font-semibold text-[#6d28d9]">Скоро</p>
        <p className="mt-1 text-sm leading-relaxed text-[#4c1d95]">
          Готовим библиотеку шаблонов: заполните данные клуба один раз — документы соберутся автоматически.
        </p>
      </div>
      <ul className="space-y-2.5">
        {DOCUMENTS.map((doc) => (
          <li key={doc.title} className="flex items-center gap-3.5 rounded-2xl border border-border-light bg-white p-3.5 shadow-[var(--shadow-card)]">
            <span className="flex h-12 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f5f3ff] text-[10px] font-bold text-[#7c3aed]">
              DOC
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold leading-snug text-text">{doc.title}</p>
              <p className="mt-0.5 text-xs text-text-secondary">
                {doc.category} · {doc.text}
              </p>
            </div>
            <IconLock size={16} className="shrink-0 text-text-muted" />
          </li>
        ))}
      </ul>
    </ToolShell>
  )
}
