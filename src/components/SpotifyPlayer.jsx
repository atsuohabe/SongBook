export default function SpotifyPlayer({ song, token, isConnected, onLogin, onPlay }) {
  if (!token) {
    return (
      <div className="text-center py-4 border-b border-white/10" style={{ background: 'var(--color-surface)' }}>
        <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
          Connect Spotify to listen while studying
        </p>
        <button
          onClick={onLogin}
          className="px-6 py-2 rounded-full font-medium border-none cursor-pointer"
          style={{ background: 'var(--color-primary)', color: '#000' }}
        >
          Connect Spotify
        </button>
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Requires Spotify Premium
        </p>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="text-center py-4 border-b border-white/10" style={{ background: 'var(--color-surface)' }}>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Connecting to Spotify...
        </p>
      </div>
    )
  }

  const handlePlay = () => {
    if (song.spotifyTrackUri) {
      onPlay(song.spotifyTrackUri)
    }
  }

  return (
    <div className="flex items-center justify-center gap-4 py-4 border-b border-white/10" style={{ background: 'var(--color-surface)' }}>
      <span className="text-sm" style={{ color: 'var(--color-primary)' }}>
        Spotify Connected
      </span>
      {song.spotifyTrackUri ? (
        <button
          onClick={handlePlay}
          className="px-4 py-1.5 rounded-full text-sm font-medium border-none cursor-pointer"
          style={{ background: 'var(--color-primary)', color: '#000' }}
        >
          Play
        </button>
      ) : (
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          No Spotify track URI configured for this song
        </span>
      )}
    </div>
  )
}
