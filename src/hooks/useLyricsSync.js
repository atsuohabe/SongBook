import { useState, useEffect, useRef } from 'react'

export function useLyricsSync(player, song) {
  const [activeLineIndex, setActiveLineIndex] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!player || !song?.lines) {
      setActiveLineIndex(null)
      return
    }

    // Check if any lines have timestamps
    const hasTimestamps = song.lines.some(l => l.startTime != null)
    if (!hasTimestamps) {
      return
    }

    intervalRef.current = setInterval(async () => {
      try {
        const state = await player.getCurrentState()
        if (!state || state.paused) return

        const positionSec = state.position / 1000

        // Binary search for active line
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
      } catch (e) {
        // Player not ready
      }
    }, 200)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [player, song])

  return { activeLineIndex }
}
