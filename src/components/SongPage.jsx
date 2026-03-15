import { useParams, Link } from 'react-router-dom'
import songs from '../data/songs/index'
import LyricsView from './LyricsView'
import SpotifyPlayer from './SpotifyPlayer'
import { useVocabLookup } from '../hooks/useVocabLookup'
import { useSpotifyContext } from '../contexts/SpotifyContext'
import { useLyricsSync } from '../hooks/useLyricsSync'

export default function SongPage() {
  const { songId } = useParams()
  const song = songs.find(s => s.id === songId)
  const vocabMap = useVocabLookup()

  const { isConnected, player, token, isMobile, login, logout, play, pause, resume, getPlaybackState } = useSpotifyContext()
  const { activeLineIndex } = useLyricsSync(
    player,
    song,
    getPlaybackState,
    isMobile
  )

  if (!song) {
    return (
      <div className="text-center py-16">
        <p style={{ color: 'var(--color-text-muted)' }}>Song not found</p>
        <Link to="/" className="mt-4 inline-block" style={{ color: 'var(--color-primary)' }}>
          ← Back to songs
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Song Header */}
      <div className="text-center py-6 border-b border-white/10">
        <Link to="/" className="text-sm mb-2 inline-block no-underline" style={{ color: 'var(--color-text-muted)' }}>
          ← Back
        </Link>
        <h1 className="text-3xl font-semibold text-white m-0">
          {song.title}
          <span className="ml-2 text-lg font-normal" style={{ color: 'var(--color-pinyin)' }}>
            {song.title_pinyin}
          </span>
        </h1>
        {song.title_meaning && (
          <p className="text-sm mt-1" style={{ color: 'var(--color-meaning)' }}>
            {song.title_meaning}
          </p>
        )}
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {song.artist} ({song.artist_pinyin}) {song.artist_en && `- ${song.artist_en}`}
        </p>
      </div>

      {/* Spotify Player */}
      <SpotifyPlayer
        song={song}
        token={token}
        player={player}
        isConnected={isConnected}
        isMobile={isMobile}
        onLogin={login}
        onLogout={logout}
        onPlay={play}
        onPause={pause}
        onResume={resume}
        getPlaybackState={getPlaybackState}
      />

      {/* Lyrics */}
      <LyricsView
        song={song}
        activeLineIndex={activeLineIndex}
        vocabMap={vocabMap}
      />
    </div>
  )
}
