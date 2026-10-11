import type { ReactNode } from 'react'
import { useNativeShell } from '../hooks/useNativeShell'

type NativeShellProps = {
  children: ReactNode
}

export function NativeShell({ children }: NativeShellProps) {
  useNativeShell()
  return children
}
