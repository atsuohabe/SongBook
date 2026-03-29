import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import songs from '../data/songs/index'
import { useUserSongs } from '../hooks/useUserSongs'

export default function SongList() {
  const [query, setQuery] = useState('')
  const [updating, setUpdating] = useState(false)
  const [copied, setCopied] = useState(false)
  const { userSongs } = useUserSongs()

  const allSongs = [...songs, ...userSongs]

  const handleUpdate = useCallback(async () => {
    setUpdating(true)
    try {
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map(key => caches.delete(key)))
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map(r => r.unregister()))
      }
      window.location.reload()
    } catch {
      window.location.reload()
    }
  }, [])

  const filtered = allSongs.filter(song => {
    const q = query.toLowerCase()
    return (
      song.title.includes(query) ||
      (song.title_pinyin || '').toLowerCase().includes(q) ||
      song.artist.includes(query) ||
      (song.artist_en || '').toLowerCase().includes(q) ||
      (song.title_meaning || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>Songs</h1>
        <Link
          to="/add-song"
          className="px-4 py-2 rounded-full text-sm font-medium no-underline"
          style={{ background: 'var(--color-primary)', color: '#000' }}
        >
          + 曲を追加
        </Link>
      </div>
      <input
        type="text"
        placeholder="Search songs... (曲名、アーティスト)"
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="w-full px-4 py-3 rounded-lg outline-none mb-6"
        style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
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
            <div className="flex items-center gap-2">
              <span className="text-xl font-medium" style={{ color: 'var(--color-text)' }}>{song.title}</span>
              {song.isUserSong && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-primary)', color: '#000', fontWeight: 600 }}>
                  My
                </span>
              )}
            </div>
            {song.title_pinyin && (
              <div className="mt-0.5">
                <span className="text-sm" style={{ color: 'var(--color-pinyin)' }}>{song.title_pinyin}</span>
                {song.title_meaning && (
                  <span className="text-sm ml-2" style={{ color: 'var(--color-meaning)' }}>({song.title_meaning})</span>
                )}
              </div>
            )}
            <div className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {song.artist} {song.artist_pinyin && `(${song.artist_pinyin})`} {song.artist_en && `- ${song.artist_en}`}
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
            No songs found
          </p>
        )}
      </div>

      {/* Update & Share Buttons */}
      <div className="text-center mt-8 mb-4 space-y-3">
        <button
          onClick={handleUpdate}
          disabled={updating}
          className="px-4 py-2 rounded-lg text-sm border-none cursor-pointer transition-colors block mx-auto"
          style={{
            background: 'var(--color-surface)',
            color: 'var(--color-text-muted)',
          }}
        >
          {updating ? '更新中...' : 'SongBookを更新する'}
        </button>
        <button
          onClick={() => {
            const url = window.location.origin + window.location.pathname
            navigator.clipboard.writeText(url).then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            })
          }}
          className="px-4 py-2 rounded-lg text-sm border-none cursor-pointer transition-colors block mx-auto"
          style={{
            background: 'var(--color-surface)',
            color: copied ? 'var(--color-primary)' : 'var(--color-text-muted)',
          }}
        >
          {copied ? 'URLをコピーしました!' : 'SongBookを共有する'}
        </button>
      </div>
    </div>
  )
}
