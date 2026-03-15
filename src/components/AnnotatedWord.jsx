import { useState, useRef } from 'react'

export default function AnnotatedWord({ word, showMeanings, vocabEntry, onTap }) {
  const [showPopup, setShowPopup] = useState(false)
  const ref = useRef(null)

  const handleClick = () => {
    if (onTap) {
      onTap(word, ref.current)
    } else {
      setShowPopup(!showPopup)
    }
  }

  return (
    <span
      ref={ref}
      className="annotated-word"
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      {showMeanings && word.meaning && (
        <span className="meaning">{word.meaning}</span>
      )}
      <span className="hanzi">{word.hanzi}</span>
      <span className="pinyin">{word.pinyin}</span>
    </span>
  )
}
