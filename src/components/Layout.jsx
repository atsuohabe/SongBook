import { Outlet, Link } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <Link to="/" className="text-xl font-semibold no-underline" style={{ color: 'var(--color-primary)' }}>
          SongBook
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Chinese Song Learning
          </span>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
