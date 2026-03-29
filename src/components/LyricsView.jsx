import { useState, useRef, useEffect, useCallback } from 'react'
import LyricLine from './LyricLine'
import WordDetailPopup from './WordDetailPopup'

export default function LyricsView({ song, activeLineIndex, vocabMap }) {
  const [showMeanings, setShowMeanings] = useState(() => {
    const saved = localStorage.getItem('songbook-show-meanings')
    return saved !== null ? JSON.parse(saved) : true
  })
  const [showPinyin, setShowPinyin] = useState(() => {
    const saved = localStorage.getItem('songbook-show-pinyin')
    return saved !== null ? JSON.parse(saved) : true
  })
  const [showTranslation, setShowTranslation] = useState(() => {
    const saved = localStorage.getItem('songbook-show-translation')
    return saved !== null ? JSON.parse(saved) : false
  })
  const [selectedWord, setSelectedWord] = useState(null)
  const [popupPosition, setPopupPosition] = useState(null)
  const lineRefs = useRef([])
  const containerRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('songbook-show-meanings', JSON.stringify(showMeanings))
  }, [showMeanings])

  useEffect(() => {
    localStorage.setItem('songbook-show-pinyin', JSON.stringify(showPinyin))
  }, [showPinyin])

  useEffect(() => {
    localStorage.setItem('songbook-show-translation', JSON.stringify(showTranslation))
  }, [showTranslation])

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

  const hasTranslation = song?.lines?.some(line => line.translation)

  if (!song) return null

  return (
    <div ref={containerRef} className="relative">
      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-3 sticky top-0 z-10 flex-wrap" style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
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
        <button
          onClick={() => setShowPinyin(!showPinyin)}
          className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors border-none cursor-pointer"
          style={{
            background: showPinyin ? 'var(--color-primary)' : 'var(--color-surface)',
            color: showPinyin ? '#000' : 'var(--color-text)',
          }}
        >
          {showPinyin ? 'Pinyin: ON' : 'Pinyin: OFF'}
        </button>
        {hasTranslation && (
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors border-none cursor-pointer"
            style={{
              background: showTranslation ? 'var(--color-primary)' : 'var(--color-surface)',
              color: showTranslation ? '#000' : 'var(--color-text)',
            }}
          >
            {showTranslation ? 'Translation: ON' : 'Translation: OFF'}
          </button>
        )}
      </div>

      {/* Lyrics */}
      <div className="px-4 py-6 max-w-3xl mx-auto">
        {song.lines.map((line, i) => (
          <LyricLine
            key={i}
            line={line}
            isActive={i === activeLineIndex}
            showMeanings={showMeanings}
            showPinyin={showPinyin}
            showTranslation={showTranslation}
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
