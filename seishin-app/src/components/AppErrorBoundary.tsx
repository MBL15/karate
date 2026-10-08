import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { failed: boolean }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#f6f4ef',
          color: '#121820',
          fontFamily: 'Manrope, sans-serif',
        }}
      >
        <div style={{ maxWidth: 360, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Экран не открылся</p>
          <p style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.5 }}>
            Обновите приложение и войдите ещё раз.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20,
              minHeight: 48,
              padding: '0 22px',
              border: 0,
              borderRadius: 14,
              background: '#121820',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            Обновить
          </button>
        </div>
      </div>
    )
  }
}
