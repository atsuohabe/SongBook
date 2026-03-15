import AnnotatedWord from './AnnotatedWord'

export default function LyricLine({ line, isActive, showMeanings, showPinyin, vocabMap, onWordTap, lineRef }) {
  return (
    <div
      ref={lineRef}
      className={`lyric-line ${isActive ? 'active' : ''}`}
    >
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
  )
}
