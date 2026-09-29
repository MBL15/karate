import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type MobileFrameProps = {
  children: ReactNode
  title: string
}

export function MobileFrame({ children, title }: MobileFrameProps) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-[#eef1f5] px-4 py-8">
      <Link to="/" className="mb-4 self-start text-sm text-[#246bfd] hover:underline">
        ← Все экраны
      </Link>
      <p className="mb-4 text-sm font-semibold text-[#6f7b91]">{title}</p>
      <div className="h-[844px] w-[390px] overflow-hidden rounded-[32px] border border-[#e5eaf0] bg-white shadow-[0_24px_64px_rgba(23,32,51,0.12)]">
        {children}
      </div>
    </div>
  )
}
