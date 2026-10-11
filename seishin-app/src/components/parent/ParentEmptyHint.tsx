import { useNavigate } from 'react-router-dom'
import { parentAccent } from '../auth/AuthWidgets'

export function ParentEmptyHint({
  title,
  description,
}: {
  title: string
  description: string
}) {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-lg px-5 pt-8">
      <div className="rounded-[1.25rem] border border-[#e4e7ec] bg-[#f9fafb] px-5 py-6 text-center">
        <h2 className="text-base font-bold text-[#101828]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#667085]">{description}</p>
        <button
          type="button"
          onClick={() => navigate('/app?link=1')}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl px-6 text-sm font-semibold text-white"
          style={{ backgroundColor: parentAccent }}
        >
          Ввести код тренера
        </button>
      </div>
    </div>
  )
}
