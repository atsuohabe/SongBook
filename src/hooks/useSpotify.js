import { useState, useEffect, useCallback, useRef } from 'react'

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || ''
// HashRouter uses the pathname as base; strip trailing hash/search for a clean redirect
const REDIRECT_URI = window.location.origin + window.location.pathname.replace(/\/$/, '') + '/'
const SCOPES = 'streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state'

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const values = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(values, v => chars[v % chars.length]).join('')
}

async function sha256(plain) {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function useSpotify() {
  const [token, setToken] = useState(null)
  const [player, setPlayer] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [deviceId, setDeviceId] = useState(null)
  const playerRef = useRef(null)

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code && CLIENT_ID) {
      const verifier = sessionStorage.getItem('spotify_code_verifier')
      if (verifier) {
        fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: CLIENT_ID,
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT_URI,
            code_verifier: verifier,
          }),
        })
          .then(r => r.json())
          .then(data => {
            if (data.access_token) {
              setToken(data.access_token)
              sessionStorage.removeItem('spotify_code_verifier')
              // Clean URL
              window.history.replaceState({}, '', window.location.pathname + window.location.hash)
            }
          })
          .catch(console.error)
      }
    }
  }, [])

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!token) return

    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    document.body.appendChild(script)

    window.onSpotifyWebPlaybackSDKReady = () => {
      const p = new window.Spotify.Player({
        name: 'SongBook Player',
        getOAuthToken: cb => cb(token),
        volume: 0.5,
      })

      p.addListener('ready', ({ device_id }) => {
        setDeviceId(device_id)
        setIsConnected(true)
      })

      p.addListener('not_ready', () => {
        setIsConnected(false)
      })

      p.addListener('initialization_error', ({ message }) => {
        console.error('Spotify init error:', message)
      })

      p.addListener('authentication_error', ({ message }) => {
        console.error('Spotify auth error:', message)
        setToken(null)
      })

      p.connect()
      playerRef.current = p
      setPlayer(p)
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect()
      }
    }
  }, [token])

  const login = useCallback(async () => {
    if (!CLIENT_ID) {
      alert('Spotify Client ID not configured. Set VITE_SPOTIFY_CLIENT_ID in .env')
      return
    }
    const verifier = generateRandomString(128)
    const challenge = await sha256(verifier)
    sessionStorage.setItem('spotify_code_verifier', verifier)

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: SCOPES,
      redirect_uri: REDIRECT_URI,
      code_challenge_method: 'S256',
      code_challenge: challenge,
    })

    window.location.href = `https://accounts.spotify.com/authorize?${params}`
  }, [])

  const play = useCallback(async (trackUri) => {
    if (!token || !deviceId) return
    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: [trackUri] }),
      })
    } catch (e) {
      console.error('Spotify play error:', e)
    }
  }, [token, deviceId])

  const pause = useCallback(async () => {
    if (!token || !deviceId) return
    try {
      await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
    } catch (e) {
      console.error('Spotify pause error:', e)
    }
  }, [token, deviceId])

  const resume = useCallback(async () => {
    if (!token || !deviceId) return
    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
    } catch (e) {
      console.error('Spotify resume error:', e)
    }
  }, [token, deviceId])

  return { token, player, isConnected, deviceId, login, play, pause, resume }
}
