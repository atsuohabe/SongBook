import { useState, useEffect, useRef } from 'react'

export default function SpotifyPlayer({ song, token, player, isConnected, isMobile, onLogin, onLogout, onPlay, onPause, onResume, onSeekRelative, getPlaybackState }) {
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
      setIsPlaying(true)
    }
  }

  const handleToggle = () => {
    if (isPlaying) {
      onPause()
    } else {
      onResume()
    }
  }

  const handleSeekBack = () => {
    onSeekRelative(-10000)
  }

  const handleSeekForward = () => {
    onSeekRelative(10000)
  }

  // Mobile: fixed bottom bar
  if (isMobile) {
    return (
      <>
        {/* Spacer to prevent content from being hidden behind the fixed bar */}
        <div style={{ height: '64px' }} />
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            background: 'var(--color-surface)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            padding: '8px 12px',
            paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
          }}
        >
          {song.spotifyTrackUri ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {/* Rewind 10s */}
              <button
                onClick={handleSeekBack}
                disabled={!hasStarted}
                className="border-none cursor-pointer"
                style={{
                  background: 'transparent',
                  color: hasStarted ? 'var(--color-text)' : 'var(--color-text-muted)',
                  fontSize: '14px',
                  padding: '8px',
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: hasStarted ? 1 : 0.4,
                }}
              >
                -10s
              </button>

              {/* Play from beginning */}
              <button
                onClick={handlePlay}
                className="border-none cursor-pointer"
                style={{
                  background: 'transparent',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  padding: '8px',
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Play from beginning"
              >
                ⏮
              </button>

              {/* Play/Pause toggle */}
              <button
                onClick={hasStarted ? handleToggle : handlePlay}
                className="border-none cursor-pointer"
                style={{
                  background: 'var(--color-primary)',
                  color: '#000',
                  fontSize: '20px',
                  padding: '0',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>

              {/* Forward 10s */}
              <button
                onClick={handleSeekForward}
                disabled={!hasStarted}
                className="border-none cursor-pointer"
                style={{
                  background: 'transparent',
                  color: hasStarted ? 'var(--color-text)' : 'var(--color-text-muted)',
                  fontSize: '14px',
                  padding: '8px',
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: hasStarted ? 1 : 0.4,
                }}
              >
                +10s
              </button>

              {/* Disconnect */}
              <button
                onClick={onLogout}
                className="border-none cursor-pointer"
                style={{
                  background: 'transparent',
                  color: 'var(--color-text-muted)',
                  fontSize: '10px',
                  padding: '4px',
                  marginLeft: '4px',
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span className="text-sm" style={{ color: 'var(--color-primary)' }}>
                Spotify Connected
              </span>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                No track URI configured
              </span>
              <button
                onClick={onLogout}
                className="px-3 py-1 rounded-full text-xs border-none cursor-pointer"
                style={{ background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-text-muted)' }}
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </>
    )
  }

  // Desktop: inline bar (original layout with added seek controls)
  return (
    <div className="flex items-center justify-center gap-4 py-4 border-b border-white/10" style={{ background: 'var(--color-surface)' }}>
      <span className="text-sm" style={{ color: 'var(--color-primary)' }}>
        Spotify Connected
      </span>
      {song.spotifyTrackUri ? (
        <div className="flex items-center gap-2">
          <button
            onClick={handleSeekBack}
            disabled={!hasStarted}
            className="px-3 py-1.5 rounded-full text-sm font-medium border-none cursor-pointer"
            style={{
              background: hasStarted ? 'var(--color-surface)' : 'transparent',
              color: hasStarted ? 'var(--color-text)' : 'var(--color-text-muted)',
              border: '1px solid var(--color-text-muted)',
              opacity: hasStarted ? 1 : 0.4,
            }}
          >
            -10s
          </button>
          <button
            onClick={handlePlay}
            className="px-3 py-1.5 rounded-full text-sm font-medium border-none cursor-pointer"
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-text-muted)',
            }}
            title="Play from beginning"
          >
            ⏮
          </button>
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
          <button
            onClick={handleSeekForward}
            disabled={!hasStarted}
            className="px-3 py-1.5 rounded-full text-sm font-medium border-none cursor-pointer"
            style={{
              background: hasStarted ? 'var(--color-surface)' : 'transparent',
              color: hasStarted ? 'var(--color-text)' : 'var(--color-text-muted)',
              border: '1px solid var(--color-text-muted)',
              opacity: hasStarted ? 1 : 0.4,
            }}
          >
            +10s
          </button>
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
