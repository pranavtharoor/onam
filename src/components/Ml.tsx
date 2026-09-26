import type { ReactNode } from 'react'
import { MALAYALAM_VERIFIED } from '../content'

/** Malayalam text. Marked for native-reader verification until MALAYALAM_VERIFIED is set. */
export function Ml({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span lang="ml" className={className} data-verify={MALAYALAM_VERIFIED ? undefined : 'malayalam'}>
      {children}
    </span>
  )
}
