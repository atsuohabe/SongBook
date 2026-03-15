import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import songs from '../data/songs/index'

export default function SongList() {
  const [query, setQuery] = useState('')
  const [updating, setUpdating] = useState(false)

  const handleUpdate = useCallback(async () => {
    setUpdating(true)
    try {
      // Clear all caches
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map(key => caches.delete(key)))
      }
      // Unregister service workers if any
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map(r => r.unregister()))
      }
      // Force reload from server
      window.location.reload()
    } catch {
      window.location.reload()
    }
  }, [])

  const filtered = songs.filter(song =>
    song.title.includes(query) ||
    song.title_pinyin.toLowerCase().includes(query.toLowerCase()) ||
    song.artist.includes(query) ||
    song.artist_en?.toLowerCase().includes(query.toLowerCase()) ||
    song.title_meaning?.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Songs</h1>
      <input
        type="text"
        placeholder="Search songs... (曲名、アーティスト)"
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-gray-500 outline-none focus:border-green-500 mb-6"
      />
      <div className="space-y-3">
        {filtered.map(song => (
          <Link
            key={song.id}
            to={`/song/${song.id}`}
            className="block p-4 rounded-lg no-underline transition-colors"
            style={{ background: 'var(--color-surface)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}
          >
            <div>
              <span className="text-xl font-medium text-white">{song.title}</span>
            </div>
            <div className="mt-0.5">
              <span className="text-sm" style={{ color: 'var(--color-pinyin)' }}>{song.title_pinyin}</span>
              {song.title_meaning && (
                <span className="text-sm ml-2" style={{ color: 'var(--color-meaning)' }}>({song.title_meaning})</span>
              )}
            </div>
            <div className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {song.artist} ({song.artist_pinyin}) {song.artist_en && `- ${song.artist_en}`}
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
            No songs found
          </p>
        )}
      </div>

      {/* Update Button */}
      <div className="text-center mt-8 mb-4">
        <button
          onClick={handleUpdate}
          disabled={updating}
          className="px-4 py-2 rounded-lg text-sm border-none cursor-pointer transition-colors"
          style={{
            background: 'var(--color-surface)',
            color: 'var(--color-text-muted)',
          }}
        >
          {updating ? '更新中...' : 'SongBookを更新する'}
        </button>
      </div>
    </div>
  )
}
