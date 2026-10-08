import { IconLock } from '../../components/ui/Icons'

const watermark = '/assets/secret/kata-watermark.svg'

export function CoachSecretPage() {
  return (
    <div className="relative mx-auto flex min-h-[calc(100dvh-6.5rem)] w-full max-w-lg flex-col overflow-hidden lg:min-h-[calc(100dvh-8rem)]">
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 pb-48 text-center">
        <span className="flex size-[4.5rem] items-center justify-center rounded-full bg-[#e6e4df] text-[#8d93a0]">
          <IconLock size={30} />
        </span>
        <h1 className="mt-6 max-w-[16rem] text-[1.35rem] font-bold leading-snug tracking-tight text-text">
          Скоро здесь кое-что интересное
        </h1>
        <p className="mt-3 max-w-[17rem] text-sm leading-relaxed text-text-secondary">
          Этот раздел пока скрыт. Здесь будет маркетплейс сетов для KataVR и магазин виртуальных тренировок.
        </p>
      </div>
      <img
        src={watermark}
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-16 -bottom-2 w-[24rem] max-w-none select-none"
      />
    </div>
  )
}
