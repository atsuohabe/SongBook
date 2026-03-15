import { useEffect, useRef } from 'react'

export default function WordDetailPopup({ word, vocabEntry, position, onClose }) {
  const popupRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  useEffect(() => {
    if (popupRef.current && position) {
      const popup = popupRef.current
      const rect = popup.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let left = position.x - rect.width / 2
      let top = position.y + 10

      if (left < 8) left = 8
      if (left + rect.width > viewportWidth - 8) left = viewportWidth - rect.width - 8
      if (top + rect.height > viewportHeight - 8) top = position.y - rect.height - 10

      popup.style.left = `${left}px`
      popup.style.top = `${top}px`
    }
  }, [position])

  if (!word) return null

  const level = vocabEntry?.level
  const pos = vocabEntry?.part_of_speech || word.part_of_speech
  const meaningEn = word.meaning || vocabEntry?.meaning_en
  const meaningJa = vocabEntry?.meaning_ja

  return (
    <div ref={popupRef} className="word-popup" style={{ left: 0, top: 0 }}>
      <div className="popup-hanzi">{word.hanzi}</div>
      <div className="popup-pinyin">{word.pinyin}</div>
      {meaningEn && <div className="popup-meaning">{meaningEn}</div>}
      {meaningJa && (
        <div className="popup-meaning" style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
          {meaningJa}
        </div>
      )}
      {pos && (
        <div style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {pos}
        </div>
      )}
      {level && <span className="popup-level">TOCFL {level}</span>}
      <a
        className="popup-link"
        href={`https://www.mdbg.net/chinese/dictionary?wdqb=${encodeURIComponent(word.hanzi)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        MDBG Dictionary →
      </a>
    </div>
  )
}
