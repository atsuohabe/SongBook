import { useState, useEffect, useRef } from 'react'

export default function SpotifyPlayer({ song, token, player, isConnected, isMobile, onLogin, onLogout, onPlay, onPause, onResume, getPlaybackState }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const pollRef = useRef(null)

  // Desktop: listen to SDK player state changes
  useEffect(() => {
    if (!player || isMobile) return
    const onStateChange = (state) => {
      if (state) {
        setIsPlaying(!state.paused)
      }
    }
    player.addListener('player_state_changed', onStateChange)
    return () => player.removeListener('player_state_changed', onStateChange)
  }, [player, isMobile])

  // Mobile: poll playback state
  useEffect(() => {
    if (!isMobile || !token || !hasStarted) return
    pollRef.current = setInterval(async () => {
      const state = await getPlaybackState?.()
      if (state) {
        setIsPlaying(state.is_playing)
      }
    }, 1000)
    return () => clearInterval(pollRef.current)
  }, [isMobile, token, hasStarted, getPlaybackState])

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
          {isMobile
            ? 'Spotify app must be open on this device'
            : 'Requires Spotify Premium'}
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
      setHasStarted(true)
    }
  }

  const handleToggle = () => {
    if (isPlaying) {
      onPause()
    } else {
      onResume()
    }
  }

  return (
    <div className="flex items-center justify-center gap-4 py-4 border-b border-white/10" style={{ background: 'var(--color-surface)' }}>
      <span className="text-sm" style={{ color: 'var(--color-primary)' }}>
        Spotify Connected
      </span>
      {song.spotifyTrackUri ? (
        <div className="flex gap-2">
          {!hasStarted ? (
            <button
              onClick={handlePlay}
              className="px-4 py-1.5 rounded-full text-sm font-medium border-none cursor-pointer"
              style={{ background: 'var(--color-primary)', color: '#000' }}
            >
              ▶ Play
            </button>
          ) : (
            <button
              onClick={handleToggle}
              className="px-4 py-1.5 rounded-full text-sm font-medium border-none cursor-pointer"
              style={{ background: 'var(--color-primary)', color: '#000' }}
            >
              {isPlaying ? '⏸ Pause' : '▶ Resume'}
            </button>
          )}
        </div>
      ) : (
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          No Spotify track URI configured for this song
        </span>
      )}
      <button
        onClick={onLogout}
        className="px-3 py-1 rounded-full text-xs border-none cursor-pointer"
        style={{ background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-text-muted)' }}
      >
        Disconnect
      </button>
    </div>
  )
}
