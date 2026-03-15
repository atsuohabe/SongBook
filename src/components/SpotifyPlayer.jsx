import { useState, useEffect, useRef } from 'react'

// SVG Icons — crisp at any size, no system font dependency
const PlayIcon = ({ size = 24, color = '#000' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.04-6.86a1 1 0 0 0 0-1.72L9.5 4.28a1 1 0 0 0-1.5.86z" fill={color} />
  </svg>
)

const PauseIcon = ({ size = 24, color = '#000' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="6" y="4" width="4" height="16" rx="1" fill={color} />
    <rect x="14" y="4" width="4" height="16" rx="1" fill={color} />
  </svg>
)

const RestartIcon = ({ size = 24, color = '#000' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="4" y="4" width="3.5" height="16" rx="1" fill={color} />
    <path d="M10 5.14v13.72a1 1 0 0 0 1.5.86l9.04-6.86a1 1 0 0 0 0-1.72L11.5 4.28a1 1 0 0 0-1.5.86z" fill={color} />
  </svg>
)

const SeekBackIcon = ({ size = 24, color = '#000' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12.5 3a9 9 0 1 0 6.36 2.64" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <polyline points="12.5 3 8 3 12.5 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <text x="12" y="15.5" textAnchor="middle" fontSize="7.5" fontWeight="700" fontFamily="system-ui, sans-serif" fill={color}>10</text>
  </svg>
)

const SeekForwardIcon = ({ size = 24, color = '#000' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M11.5 3a9 9 0 1 1-6.36 2.64" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <polyline points="11.5 3 16 3 11.5 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <text x="12" y="15.5" textAnchor="middle" fontSize="7.5" fontWeight="700" fontFamily="system-ui, sans-serif" fill={color}>10</text>
  </svg>
)

const CloseIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M3 3l8 8M11 3l-8 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

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

  // Shared round button style
  const roundBtn = (size, extra = {}) => ({
    background: 'var(--color-primary)',
    color: '#000',
    padding: '0',
    border: 'none',
    borderRadius: '50%',
    width: `${size}px`,
    height: `${size}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    ...extra,
  })

  // --- Not authenticated ---
  if (!token) {
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
            <button
              onClick={handleSeekBack}
              disabled={!hasStarted}
              style={roundBtn(44, { opacity: hasStarted ? 1 : 0.3 })}
            >
              <SeekBackIcon size={22} />
            </button>

            <button
              onClick={handlePlay}
              style={roundBtn(44)}
              title="Play from beginning"
            >
              <RestartIcon size={20} />
            </button>

            <button
              onClick={hasStarted ? handleToggle : handlePlay}
              style={roundBtn(56, { boxShadow: '0 2px 12px rgba(29, 185, 84, 0.3)' })}
            >
              {isPlaying ? <PauseIcon size={28} /> : <PlayIcon size={28} />}
            </button>

            <button
              onClick={handleSeekForward}
              disabled={!hasStarted}
              style={roundBtn(44, { opacity: hasStarted ? 1 : 0.3 })}
            >
              <SeekForwardIcon size={22} />
            </button>

            <button
              onClick={onLogout}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                opacity: 0.4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CloseIcon size={14} color="var(--color-text-muted)" />
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
            <RestartIcon size={16} color="var(--color-text)" />
          </button>
          {!hasStarted ? (
            <button
              onClick={handlePlay}
              className="px-4 py-1.5 rounded-full text-sm font-medium border-none cursor-pointer flex items-center gap-1.5"
              style={{ background: 'var(--color-primary)', color: '#000' }}
            >
              <PlayIcon size={14} /> Play
            </button>
          ) : (
            <button
              onClick={handleToggle}
              className="px-4 py-1.5 rounded-full text-sm font-medium border-none cursor-pointer flex items-center gap-1.5"
              style={{ background: 'var(--color-primary)', color: '#000' }}
            >
              {isPlaying ? <><PauseIcon size={14} /> Pause</> : <><PlayIcon size={14} /> Resume</>}
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
