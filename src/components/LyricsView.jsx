import { useState, useRef, useEffect, useCallback } from 'react'
import LyricLine from './LyricLine'
import WordDetailPopup from './WordDetailPopup'

export default function LyricsView({ song, activeLineIndex, vocabMap }) {
  const [showMeanings, setShowMeanings] = useState(() => {
    const saved = localStorage.getItem('songbook-show-meanings')
    return saved !== null ? JSON.parse(saved) : true
  })
  const [selectedWord, setSelectedWord] = useState(null)
  const [popupPosition, setPopupPosition] = useState(null)
  const lineRefs = useRef([])
  const containerRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('songbook-show-meanings', JSON.stringify(showMeanings))
  }, [showMeanings])

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineIndex != null && lineRefs.current[activeLineIndex]) {
      lineRefs.current[activeLineIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [activeLineIndex])

  const handleWordTap = useCallback((word, element) => {
    if (element) {
      const rect = element.getBoundingClientRect()
      setPopupPosition({ x: rect.left + rect.width / 2, y: rect.bottom })
    }
    setSelectedWord(word)
  }, [])

  const closePopup = useCallback(() => {
    setSelectedWord(null)
    setPopupPosition(null)
  }, [])

  if (!song) return null

  return (
    <div ref={containerRef} className="relative">
      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-3 border-b border-white/10 sticky top-0 z-10" style={{ background: 'var(--color-bg)' }}>
        <button
          onClick={() => setShowMeanings(!showMeanings)}
          className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors border-none cursor-pointer"
          style={{
            background: showMeanings ? 'var(--color-primary)' : 'var(--color-surface)',
            color: showMeanings ? '#000' : 'var(--color-text)',
          }}
        >
          {showMeanings ? 'Meanings: ON' : 'Meanings: OFF'}
        </button>
      </div>

      {/* Lyrics */}
      <div className="px-4 py-6 max-w-3xl mx-auto">
        {song.lines.map((line, i) => (
          <LyricLine
            key={i}
            line={line}
            isActive={i === activeLineIndex}
            showMeanings={showMeanings}
            vocabMap={vocabMap}
            onWordTap={handleWordTap}
            lineRef={el => lineRefs.current[i] = el}
          />
        ))}
      </div>

      {/* Word Detail Popup */}
      {selectedWord && (
        <WordDetailPopup
          word={selectedWord}
          vocabEntry={vocabMap?.[selectedWord.hanzi]}
          position={popupPosition}
          onClose={closePopup}
        />
      )}
    </div>
  )
}
