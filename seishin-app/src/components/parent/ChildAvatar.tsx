import { useRef, type ChangeEvent } from 'react'
import { useStoredState } from '../../hooks/useStoredState'

const MAX_SIDE = 256

function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const side = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = Math.min(MAX_SIDE, side)
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('canvas'))
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = reject
    img.src = url
  })
}

export function useChildPhoto(childId: number | null | undefined) {
  return useStoredState<string>(`child-photo:${childId ?? 'none'}`, '')
}

export function ChildAvatar({
  childId,
  photoKey,
  name,
  size = 56,
  editable = false,
}: {
  childId?: number | null
  photoKey?: string
  name: string
  size?: number
  editable?: boolean
}) {
  const [photo, setPhoto] = useStoredState<string>(photoKey ?? `child-photo:${childId ?? 'none'}`, '')
  const input = useRef<HTMLInputElement>(null)
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setPhoto(await resizeToDataUrl(file))
    } catch {
      /* unsupported image */
    }
  }

  const face = photo ? (
    <img src={photo} alt="" className="size-full object-cover" />
  ) : (
    <span className="text-lg font-bold text-brand-green">{initials || '?'}</span>
  )

  const box = 'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-green-light ring-2 ring-white shadow-[var(--shadow-card)]'

  if (!editable) {
    return (
      <span className={box} style={{ width: size, height: size }} aria-hidden>
        {face}
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        aria-label={photo ? 'Сменить фото' : 'Добавить фото'}
        className="relative shrink-0 rounded-full"
        style={{ width: size, height: size }}
      >
        <span className={`size-full ${box}`}>{face}</span>
        {!photo && (
          <span className="absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full bg-brand-green text-[13px] font-bold leading-none text-white ring-2 ring-white">
            +
          </span>
        )}
      </button>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => void onPick(e)} />
    </>
  )
}
