import { IconLock } from './Icons'

const watermark = '/assets/secret/kata-watermark.svg'

export function SecretComingSoon() {
  return (
    <div className="relative flex min-h-[calc(100dvh-5.75rem)] flex-col overflow-hidden bg-[#f5f4f1] lg:min-h-[calc(100dvh-4rem-3rem)] lg:rounded-2xl">
      <div className="relative z-10 flex flex-1 flex-col items-center px-6 pb-8 pt-16 text-center sm:pt-20 lg:pt-24">
        <span className="flex size-16 items-center justify-center rounded-full bg-[#ebe9e4] text-text-secondary">
          <IconLock size={28} />
        </span>

        <h1 className="mt-8 max-w-xs text-[1.35rem] font-bold leading-snug tracking-tight text-text sm:max-w-sm sm:text-2xl">
          Скоро здесь кое-что интересное
        </h1>

        <p className="mt-4 max-w-[17.5rem] text-sm leading-relaxed text-text-secondary sm:max-w-xs">
          Этот раздел пока скрыт. Здесь будет маркетплейс сетов для KataVR и магазин виртуальных тренировок.
        </p>
      </div>

      <img
        src={watermark}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto w-[min(100%,22rem)] max-w-none select-none opacity-90 sm:w-[26rem]"
      />
    </div>
  )
}
