import { COLORS, type ColorKey } from '../../utils/beltSystem'

export function BeltStrip({ color, stripe, size = 'md' }: { color: ColorKey; stripe: ColorKey | null; size?: 'sm' | 'md' | 'lg' }) {
  const light = color === 'white'
  const box = size === 'sm' ? 'h-3.5 w-9 rounded' : size === 'lg' ? 'h-9 w-24 rounded-lg' : 'h-6 w-16 rounded-md'
  const knot = size === 'sm' ? 'left-3 w-1' : size === 'lg' ? 'left-7 w-3' : 'left-5 w-2'
  const tip = size === 'sm' ? 'right-1 w-1.5' : size === 'lg' ? 'right-3 w-3.5' : 'right-2 w-2.5'
  return (
    <span
      className={`relative flex shrink-0 overflow-hidden shadow-[inset_0_-2px_0_rgb(0_0_0/0.08)] ${box} ${light ? 'ring-1 ring-border ring-inset' : ''}`}
      style={{ backgroundColor: COLORS[color].hex }}
      aria-hidden
    >
      <span className={`absolute inset-y-0 bg-black/10 ${knot}`} />
      {stripe && (
        <span
          className={`absolute inset-y-0 ${tip} ${stripe === 'white' ? 'ring-1 ring-border ring-inset' : ''}`}
          style={{ backgroundColor: COLORS[stripe].hex }}
        />
      )}
    </span>
  )
}
