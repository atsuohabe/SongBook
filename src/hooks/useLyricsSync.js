import { useState, useEffect, useRef } from 'react'

export function useLyricsSync(player, song, getPlaybackState, isMobile) {
  const [activeLineIndex, setActiveLineIndex] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!song?.lines) {
      setActiveLineIndex(null)
      return
    }

    // Check if any lines have timestamps
    const hasTimestamps = song.lines.some(l => l.startTime != null)
    if (!hasTimestamps) {
      return
    }

    const findActiveLine = (positionSec) => {
      let lo = 0
      let hi = song.lines.length - 1
      let result = -1

      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2)
        if (song.lines[mid].startTime <= positionSec) {
          result = mid
          lo = mid + 1
        } else {
          hi = mid - 1
        }
      }

      setActiveLineIndex(result >= 0 ? result : null)
    }

    if (isMobile) {
      // Mobile: poll via Spotify Web API
      if (!getPlaybackState) return
      intervalRef.current = setInterval(async () => {
        try {
          const state = await getPlaybackState()
          if (!state || !state.is_playing) return
          findActiveLine(state.progress_ms / 1000)
        } catch {
          // API not ready
        }
      }, 500)
    } else {
      // Desktop: poll via Web Playback SDK
      if (!player) {
        setActiveLineIndex(null)
        return
      }
      intervalRef.current = setInterval(async () => {
        try {
          const state = await player.getCurrentState()
          if (!state || state.paused) return
          findActiveLine(state.position / 1000)
        } catch {
          // Player not ready
        }
      }, 200)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [player, song, getPlaybackState, isMobile])

  return { activeLineIndex }
}
