import { useRef, useState, type ChangeEvent } from 'react'
import { useStoredState } from '../../hooks/useStoredState'
import { PhotoCrop } from '../ui/PhotoCrop'

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
  const [cropFile, setCropFile] = useState<File | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) setCropFile(file)
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
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={onPick} />
      {cropFile && (
        <PhotoCrop
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onDone={(data) => {
            setPhoto(data)
            setCropFile(null)
          }}
        />
      )}
    </>
  )
}
