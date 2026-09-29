import { SkipLink } from '../a11y/SkipLink'
import { AnimatedOutlet } from './AnimatedOutlet'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

export function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <SkipLink />
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <AnimatedOutlet />
      </main>
      <SiteFooter />
    </div>
  )
}
