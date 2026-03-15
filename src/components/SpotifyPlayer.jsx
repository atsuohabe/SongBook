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

  // --- Not authenticated ---
  if (!token) {
    // Mobile: show connect as a compact fixed bottom bar
    if (isMobile) {
      return (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            background: 'rgba(26, 26, 46, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '16px 20px',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
            textAlign: 'center',
          }}
        >
          <button
            onClick={onLogin}
            className="border-none cursor-pointer"
            style={{
              background: 'var(--color-primary)',
              color: '#000',
              fontSize: '14px',
              fontWeight: 600,
              padding: '10px 28px',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '300px',
            }}
          >
            Connect Spotify
          </button>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '11px', margin: '6px 0 0' }}>
            Spotify app must be open on this device
          </p>
        </div>
      )
    }
    // Desktop: inline
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

  // --- Connecting ---
  if (!isConnected) {
    if (isMobile) {
      return (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            background: 'rgba(26, 26, 46, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '18px 20px',
            paddingBottom: 'max(18px, env(safe-area-inset-bottom))',
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: 0 }}>
            Connecting to Spotify...
          </p>
        </div>
      )
    }
    return (
      <div className="text-center py-4 border-b border-white/10" style={{ background: 'var(--color-surface)' }}>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Connecting to Spotify...
        </p>
      </div>
    )
  }

  // --- Connected: Mobile fixed bottom bar ---
  if (isMobile) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'rgba(26, 26, 46, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '12px 16px',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        }}
      >
        {song.spotifyTrackUri ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', maxWidth: '420px', margin: '0 auto' }}>
            {/* Rewind 10s */}
            <button
              onClick={handleSeekBack}
              disabled={!hasStarted}
              className="border-none cursor-pointer"
              style={{
                background: 'var(--color-primary)',
                color: '#000',
                fontSize: '13px',
                fontWeight: 700,
                padding: '0',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: hasStarted ? 1 : 0.3,
                transition: 'opacity 0.2s',
                flexShrink: 0,
              }}
            >
              -10
            </button>

            {/* Play from beginning */}
            <button
              onClick={handlePlay}
              className="border-none cursor-pointer"
              style={{
                background: 'var(--color-primary)',
                color: '#000',
                fontSize: '16px',
                padding: '0',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'opacity 0.2s',
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
                fontSize: '24px',
                padding: '0',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 12px rgba(29, 185, 84, 0.3)',
                transition: 'transform 0.15s, box-shadow 0.15s',
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
                background: 'var(--color-primary)',
                color: '#000',
                fontSize: '13px',
                fontWeight: 700,
                padding: '0',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: hasStarted ? 1 : 0.3,
                transition: 'opacity 0.2s',
                flexShrink: 0,
              }}
            >
              +10
            </button>

            {/* Disconnect */}
            <button
              onClick={onLogout}
              className="border-none cursor-pointer"
              style={{
                background: 'none',
                color: 'var(--color-text-muted)',
                fontSize: '11px',
                padding: '8px',
                opacity: 0.5,
                transition: 'opacity 0.2s',
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--color-primary)', fontSize: '13px' }}>
              Spotify Connected
            </span>
            <button
              onClick={onLogout}
              className="border-none cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: 'var(--color-text-muted)',
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: '16px',
              }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    )
  }

  // --- Connected: Desktop inline bar ---
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
