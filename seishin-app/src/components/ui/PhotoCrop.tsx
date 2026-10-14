import { useEffect, useRef, useState } from 'react'

const VIEW = 280

export function PhotoCrop({
  file,
  onCancel,
  onDone,
}: {
  file: File
  onCancel: () => void
  onDone: (dataUrl: string) => void
}) {
  const [url, setUrl] = useState('')
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  useEffect(() => {
    const next = URL.createObjectURL(file)
    setUrl(next)
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    return () => URL.revokeObjectURL(next)
  }, [file])

  const confirm = async () => {
    const img = new Image()
    img.src = url
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 512
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const cover = Math.max(VIEW / img.width, VIEW / img.height) * zoom
    const scale = (512 / VIEW) * cover
    ctx.drawImage(
      img,
      (512 - img.width * scale) / 2 + offset.x * (512 / VIEW),
      (512 - img.height * scale) / 2 + offset.y * (512 / VIEW),
      img.width * scale,
      img.height * scale,
    )
    onDone(canvas.toDataURL('image/jpeg', 0.88))
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <div role="dialog" aria-label="Кадрирование фото" className="w-full max-w-sm rounded-3xl bg-white p-4 shadow-[var(--shadow-elevated)]">
        <p className="text-base font-semibold text-text">Кадрирование</p>
        <p className="mt-1 text-xs text-text-secondary">Сдвиньте фото и выберите масштаб</p>
        <div
          className="relative mx-auto mt-3 size-[280px] touch-none overflow-hidden rounded-full bg-surface-muted"
          onPointerDown={(event) => {
            drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y }
            event.currentTarget.setPointerCapture(event.pointerId)
          }}
          onPointerMove={(event) => {
            if (!drag.current) return
            setOffset({
              x: drag.current.ox + event.clientX - drag.current.x,
              y: drag.current.oy + event.clientY - drag.current.y,
            })
          }}
          onPointerUp={() => {
            drag.current = null
          }}
          onPointerCancel={() => {
            drag.current = null
          }}
        >
          {url && (
            <img
              src={url}
              alt=""
              draggable={false}
              className="pointer-events-none absolute top-1/2 left-1/2 h-full w-full max-w-none object-cover select-none"
              style={{ transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})` }}
            />
          )}
        </div>
        <label className="mt-4 block text-xs font-semibold text-text-secondary">
          Масштаб
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="mt-1 w-full accent-brand-blue"
          />
        </label>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">
            Отмена
          </button>
          <button type="button" onClick={() => void confirm()} className="btn-coach flex-1">
            Готово
          </button>
        </div>
      </div>
    </div>
  )
}
