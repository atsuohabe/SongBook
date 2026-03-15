import { Outlet, Link } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold no-underline" style={{ color: 'var(--color-primary)' }}>
          SongBook
        </Link>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Chinese Song Learning
        </span>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
