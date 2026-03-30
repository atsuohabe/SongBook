import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import songs from '../data/songs/index'
import { useUserSongs } from '../hooks/useUserSongs'

export default function SongList() {
  const [query, setQuery] = useState('')
  const [updating, setUpdating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showManage, setShowManage] = useState(false)
  const {
    userSongs, trashedSongs, hiddenSongIds,
    restoreUserSong, permanentDeleteSong,
    unhideSong,
  } = useUserSongs()

  // Filter out hidden built-in songs
  const visibleBuiltIn = songs.filter(s => !hiddenSongIds.includes(s.id))
  const allSongs = [...visibleBuiltIn, ...userSongs]

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

  const hiddenBuiltIn = songs.filter(s => hiddenSongIds.includes(s.id))
  const hasManageItems = trashedSongs.length > 0 || hiddenBuiltIn.length > 0

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

      {/* Manage: Trash & Hidden Songs */}
      {hasManageItems && (
        <div className="mt-8">
          <button
            onClick={() => setShowManage(!showManage)}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium border-none cursor-pointer"
            style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
          >
            {showManage ? '管理を閉じる' : `管理（ゴミ箱: ${trashedSongs.length}件、非表示: ${hiddenBuiltIn.length}件）`}
          </button>

          {showManage && (
            <div className="mt-3 space-y-4">
              {/* Trashed user songs */}
              {trashedSongs.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    ゴミ箱（ユーザー曲）
                  </h3>
                  <div className="space-y-2">
                    {trashedSongs.map(song => (
                      <div
                        key={song.id}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ background: 'var(--color-surface)' }}
                      >
                        <div>
                          <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{song.title}</span>
                          <span className="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>{song.artist}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => restoreUserSong(song.id)}
                            className="px-3 py-1 rounded-full text-xs border-none cursor-pointer"
                            style={{ background: 'var(--color-primary)', color: '#000', fontWeight: 600 }}
                          >
                            復元
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`「${song.title}」を完全に削除しますか？この操作は取り消せません。`)) {
                                permanentDeleteSong(song.id)
                              }
                            }}
                            className="px-3 py-1 rounded-full text-xs border-none cursor-pointer"
                            style={{ background: 'var(--color-surface-hover)', color: '#e53935', fontWeight: 600 }}
                          >
                            完全削除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hidden built-in songs */}
              {hiddenBuiltIn.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    非表示のビルトイン曲
                  </h3>
                  <div className="space-y-2">
                    {hiddenBuiltIn.map(song => (
                      <div
                        key={song.id}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ background: 'var(--color-surface)' }}
                      >
                        <div>
                          <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{song.title}</span>
                          <span className="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>{song.artist}</span>
                        </div>
                        <button
                          onClick={() => unhideSong(song.id)}
                          className="px-3 py-1 rounded-full text-xs border-none cursor-pointer"
                          style={{ background: 'var(--color-primary)', color: '#000', fontWeight: 600 }}
                        >
                          再表示
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
