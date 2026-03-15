import AnnotatedWord from './AnnotatedWord'

export default function LyricLine({ line, isActive, showMeanings, showPinyin, showTranslation, vocabMap, onWordTap, lineRef }) {
  return (
    <div
      ref={lineRef}
      className={`lyric-line ${isActive ? 'active' : ''}`}
    >
      <div className="lyric-line-words">
        {line.words.map((word, i) => (
          <AnnotatedWord
            key={i}
            word={word}
            showMeanings={showMeanings}
            showPinyin={showPinyin}
            vocabEntry={vocabMap?.[word.hanzi]}
            onTap={onWordTap}
          />
        ))}
      </div>
      {showTranslation && line.translation && (
        <div className="lyric-translation">{line.translation}</div>
      )}
    </div>
  )
}
