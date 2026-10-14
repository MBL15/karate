import { App } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { useEffect } from 'react'
import { flushAuthStorage } from '../utils/authStorage'
import { isNativeApp } from '../utils/platform'

export function useNativeShell() {
  useEffect(() => {
    if (!isNativeApp()) return

    document.documentElement.classList.add('native-app')

    void (async () => {
      try {
        // Контент не рисуется под системной строкой — и на эмуляторе, и на телефоне.
        await StatusBar.setOverlaysWebView({ overlay: false })
      } catch {
        /* plugin unavailable */
      }
      await StatusBar.setStyle({ style: Style.Light })
      await StatusBar.setBackgroundColor({ color: '#ffffff' })
    })()

    const backListener = App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
        return
      }
      void flushAuthStorage().finally(() => {
        void App.minimizeApp()
      })
    })

    const pauseListener = App.addListener('pause', () => {
      void flushAuthStorage()
    })

    return () => {
      document.documentElement.classList.remove('native-app')
      void backListener.then((handle) => handle.remove())
      void pauseListener.then((handle) => handle.remove())
    }
  }, [])
}
