export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="skip-link"
      onClick={(event) => {
        const main = document.getElementById('main-content')
        if (!main) return
        event.preventDefault()
        main.focus()
      }}
    >
      Перейти к содержимому
    </a>
  )
}
