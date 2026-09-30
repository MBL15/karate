import { App } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { useEffect } from 'react'
import { isNativeApp } from '../utils/platform'

export function useNativeShell() {
  useEffect(() => {
    if (!isNativeApp()) return

    document.documentElement.classList.add('native-app')

    void StatusBar.setStyle({ style: Style.Dark })
    void StatusBar.setBackgroundColor({ color: '#121820' })

    const backListener = App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
        return
      }
      void App.minimizeApp()
    })

    return () => {
      document.documentElement.classList.remove('native-app')
      void backListener.then((handle) => handle.remove())
    }
  }, [])
}
