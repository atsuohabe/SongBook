import { useState, useEffect, useCallback, useRef } from 'react'

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || ''
// HashRouter uses the pathname as base; strip trailing hash/search for a clean redirect
const REDIRECT_URI = window.location.origin + window.location.pathname.replace(/\/$/, '') + '/'
const SCOPES = 'streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state'
const TOKEN_KEY = 'songbook_spotify_token'

// Initial mobile hint from user-agent; refined at runtime if SDK fails
const isMobileUA = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

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

function saveTokenData(data) {
  const tokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  }
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenData))
  return tokenData
}

function loadTokenData() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function clearTokenData() {
  localStorage.removeItem(TOKEN_KEY)
}

async function refreshAccessToken(refreshToken) {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  const data = await res.json()
  if (data.access_token) {
    // Spotify may or may not return a new refresh_token
    return saveTokenData({
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_in: data.expires_in,
    })
  }
  throw new Error(data.error || 'Token refresh failed')
}

export function useSpotify() {
  const [token, setToken] = useState(null)
  const [player, setPlayer] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [deviceId, setDeviceId] = useState(null)
  const [isMobile, setIsMobile] = useState(isMobileUA)
  const playerRef = useRef(null)
  const refreshTimerRef = useRef(null)

  // Schedule token refresh 5 minutes before expiry
  const scheduleRefresh = useCallback((tokenData) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    const msUntilExpiry = tokenData.expires_at - Date.now()
    const refreshIn = Math.max(msUntilExpiry - 5 * 60 * 1000, 0)
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const newData = await refreshAccessToken(tokenData.refresh_token)
        setToken(newData.access_token)
        scheduleRefresh(newData)
      } catch (e) {
        console.error('Token refresh failed:', e)
        setToken(null)
        clearTokenData()
      }
    }, refreshIn)
  }, [])

  // Restore token from localStorage on mount
  useEffect(() => {
    const stored = loadTokenData()
    if (!stored) return

    if (stored.expires_at > Date.now()) {
      setToken(stored.access_token)
      scheduleRefresh(stored)
    } else if (stored.refresh_token) {
      // Token expired, try refresh
      refreshAccessToken(stored.refresh_token)
        .then(newData => {
          setToken(newData.access_token)
          scheduleRefresh(newData)
        })
        .catch(() => clearTokenData())
    }
  }, [scheduleRefresh])

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
              const tokenData = saveTokenData(data)
              setToken(data.access_token)
              scheduleRefresh(tokenData)
              sessionStorage.removeItem('spotify_code_verifier')
              // Clean URL
              window.history.replaceState({}, '', window.location.pathname + window.location.hash)
            }
          })
          .catch(console.error)
      }
    }
  }, [scheduleRefresh])

  // Fall back to mobile (API-based) mode: disconnect SDK and mark connected
  const fallbackToMobile = useCallback(() => {
    console.warn('Web Playback SDK not supported, falling back to API-based playback')
    if (playerRef.current) {
      playerRef.current.disconnect()
      playerRef.current = null
      setPlayer(null)
    }
    setDeviceId(null)
    setIsMobile(true)
    setIsConnected(true)
  }, [])

  // Desktop: Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!token || isMobile) return

    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    document.body.appendChild(script)

    window.onSpotifyWebPlaybackSDKReady = () => {
      const p = new window.Spotify.Player({
        name: 'SongBook Player',
        getOAuthToken: cb => {
          // Always provide fresh token from localStorage
          const stored = loadTokenData()
          cb(stored ? stored.access_token : token)
        },
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
        fallbackToMobile()
      })

      p.addListener('playback_error', ({ message }) => {
        console.error('Spotify playback error:', message)
        fallbackToMobile()
      })

      p.addListener('authentication_error', ({ message }) => {
        console.error('Spotify auth error:', message)
        setToken(null)
        clearTokenData()
      })

      // If SDK connects but no 'ready' event within 5s, fall back
      const readyTimeout = setTimeout(() => {
        if (!playerRef.current) return
        // Check if we got a device_id; if not, SDK isn't working
        if (!deviceId) {
          fallbackToMobile()
        }
      }, 5000)

      p.connect()
      playerRef.current = p
      setPlayer(p)

      return () => clearTimeout(readyTimeout)
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect()
        playerRef.current = null
        setPlayer(null)
      }
    }
  }, [token, isMobile, fallbackToMobile])

  // Mobile: mark as connected once we have a token (no SDK needed)
  useEffect(() => {
    if (isMobile && token) {
      setIsConnected(true)
    }
  }, [isMobile, token])

  // Cleanup refresh timer
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, [])

  const login = useCallback(async () => {
    if (!CLIENT_ID) {
      alert('Spotify Client ID not configured. Set VITE_SPOTIFY_CLIENT_ID in .env')
      return
    }
    try {
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
    } catch (e) {
      console.error('Spotify login error:', e)
      alert('Spotify認証の開始に失敗しました。ブラウザを再読み込みしてお試しください。')
    }
  }, [])

  const logout = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.disconnect()
      playerRef.current = null
      setPlayer(null)
    }
    setToken(null)
    setIsConnected(false)
    setDeviceId(null)
    clearTokenData()
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
  }, [])

  // Helper for authenticated API calls with auto-refresh on 401
  const apiFetch = useCallback(async (url, options = {}) => {
    const stored = loadTokenData()
    const currentToken = stored ? stored.access_token : token
    if (!currentToken) return null

    let res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${currentToken}`,
      },
    })

    // If 401, try refreshing the token once
    if (res.status === 401 && stored?.refresh_token) {
      try {
        const newData = await refreshAccessToken(stored.refresh_token)
        setToken(newData.access_token)
        scheduleRefresh(newData)
        res = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newData.access_token}`,
          },
        })
      } catch {
        setToken(null)
        clearTokenData()
        return null
      }
    }
    return res
  }, [token, scheduleRefresh])

  // Mobile: find an available Spotify device (exclude the web SDK device which can't play audio on mobile)
  const findMobileDevice = useCallback(async () => {
    const res = await apiFetch('https://api.spotify.com/v1/me/player/devices')
    if (!res) return null
    const data = await res.json()
    if (!data.devices || data.devices.length === 0) return null
    // Filter out the SongBook Player (web SDK device that can't output audio on mobile)
    const usable = data.devices.filter(d => d.name !== 'SongBook Player')
    if (usable.length === 0) return null
    return usable.find(d => d.is_active) || usable[0]
  }, [apiFetch])

  const play = useCallback(async (trackUri) => {
    if (!token) return
    try {
      if (isMobile) {
        // Mobile: find a device to play on
        let device = await findMobileDevice()
        if (!device) {
          // Try to launch the Spotify app via URI scheme
          window.location.href = 'spotify:'
          // Wait a moment for the app to wake up, then retry
          await new Promise(r => setTimeout(r, 2500))
          device = await findMobileDevice()
          if (!device) {
            alert('Spotifyアプリが見つかりません。Spotifyアプリを起動してから再試行してください。')
            return
          }
        }
        await apiFetch(`https://api.spotify.com/v1/me/player/play?device_id=${device.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uris: [trackUri] }),
        })
      } else {
        if (!deviceId) return
        await apiFetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uris: [trackUri] }),
        })
      }
    } catch (e) {
      console.error('Spotify play error:', e)
    }
  }, [token, deviceId, apiFetch, findMobileDevice])

  const pause = useCallback(async () => {
    if (!token) return
    try {
      if (isMobile) {
        const device = await findMobileDevice()
        if (!device) return
        await apiFetch(`https://api.spotify.com/v1/me/player/pause?device_id=${device.id}`, { method: 'PUT' })
      } else {
        if (!deviceId) return
        await apiFetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, { method: 'PUT' })
      }
    } catch (e) {
      console.error('Spotify pause error:', e)
    }
  }, [token, deviceId, apiFetch, findMobileDevice])

  const resume = useCallback(async () => {
    if (!token) return
    try {
      if (isMobile) {
        const device = await findMobileDevice()
        if (!device) return
        await apiFetch(`https://api.spotify.com/v1/me/player/play?device_id=${device.id}`, { method: 'PUT' })
      } else {
        if (!deviceId) return
        await apiFetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, { method: 'PUT' })
      }
    } catch (e) {
      console.error('Spotify resume error:', e)
    }
  }, [token, deviceId, apiFetch, findMobileDevice])

  const seek = useCallback(async (positionMs) => {
    if (!token) return
    try {
      if (isMobile) {
        const device = await findMobileDevice()
        if (!device) return
        await apiFetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}&device_id=${device.id}`, { method: 'PUT' })
      } else {
        if (!deviceId) return
        await apiFetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}&device_id=${deviceId}`, { method: 'PUT' })
      }
    } catch (e) {
      console.error('Spotify seek error:', e)
    }
  }, [token, deviceId, apiFetch, findMobileDevice])

  const seekRelative = useCallback(async (deltaMs) => {
    try {
      let currentPositionMs = 0
      if (!isMobile && player) {
        const state = await player.getCurrentState()
        if (state) currentPositionMs = state.position
      } else {
        const res = await apiFetch('https://api.spotify.com/v1/me/player')
        if (res && res.status !== 204) {
          const state = await res.json()
          if (state) currentPositionMs = state.progress_ms
        }
      }
      const newPosition = Math.max(0, currentPositionMs + deltaMs)
      await seek(newPosition)
    } catch (e) {
      console.error('Spotify seekRelative error:', e)
    }
  }, [isMobile, player, apiFetch, seek])

  // Mobile: poll playback state via API
  const getPlaybackState = useCallback(async () => {
    if (!token) return null
    try {
      const res = await apiFetch('https://api.spotify.com/v1/me/player')
      if (!res || res.status === 204) return null
      return await res.json()
    } catch {
      return null
    }
  }, [token, apiFetch])

  return {
    token, player, isConnected, deviceId, isMobile,
    login, logout, play, pause, resume, seek, seekRelative, getPlaybackState,
  }
}
