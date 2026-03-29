import { useParams, Link, useNavigate } from 'react-router-dom'
import songs from '../data/songs/index'
import LyricsView from './LyricsView'
import SpotifyPlayer from './SpotifyPlayer'
import { useVocabLookup } from '../hooks/useVocabLookup'
import { useSpotifyContext } from '../contexts/SpotifyContext'
import { useLyricsSync } from '../hooks/useLyricsSync'
import { useUserSongs } from '../hooks/useUserSongs'

export default function SongPage() {
  const { songId } = useParams()
  const navigate = useNavigate()
  const { userSongs, deleteUserSong } = useUserSongs()
  const song = songs.find(s => s.id === songId) || userSongs.find(s => s.id === songId)
  const vocabMap = useVocabLookup()

  const { isConnected, player, token, isMobile, login, logout, play, pause, resume, seekRelative, getPlaybackState } = useSpotifyContext()
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

  const handleDelete = () => {
    if (window.confirm('この曲を削除しますか？')) {
      deleteUserSong(song.id)
      navigate('/')
    }
  }

  return (
    <div style={isMobile ? { paddingBottom: '120px' } : undefined}>
      {/* Song Header */}
      <div className="text-center py-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <Link to="/" className="text-sm mb-2 inline-block no-underline" style={{ color: 'var(--color-text-muted)' }}>
          ← Back
        </Link>
        <h1 className="text-3xl font-semibold m-0" style={{ color: 'var(--color-text)' }}>
          {song.title}
        </h1>
        {song.title_pinyin && (
          <p className="text-lg mt-1 mb-0" style={{ color: 'var(--color-pinyin)' }}>
            {song.title_pinyin}
          </p>
        )}
        {song.title_meaning && (
          <p className="text-sm mt-1" style={{ color: 'var(--color-meaning)' }}>
            {song.title_meaning}
          </p>
        )}
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {song.artist} {song.artist_pinyin && `(${song.artist_pinyin})`} {song.artist_en && `- ${song.artist_en}`}
        </p>

        {/* Edit/Delete buttons for user songs */}
        {song.isUserSong && (
          <div className="flex items-center justify-center gap-3 mt-3">
            <Link
              to={`/edit-song/${song.id}`}
              className="px-4 py-1.5 rounded-full text-sm font-medium no-underline"
              style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
            >
              編集
            </Link>
            <button
              onClick={handleDelete}
              className="px-4 py-1.5 rounded-full text-sm font-medium border-none cursor-pointer"
              style={{ background: 'var(--color-surface)', color: '#e53935', border: '1px solid var(--color-border)' }}
            >
              削除
            </button>
          </div>
        )}
      </div>

      {/* Spotify Player */}
      {!isMobile && (
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
          onSeekRelative={seekRelative}
          getPlaybackState={getPlaybackState}
        />
      )}

      {/* Lyrics */}
      <LyricsView
        song={song}
        activeLineIndex={activeLineIndex}
        vocabMap={vocabMap}
      />

      {/* Mobile: fixed bottom player */}
      {isMobile && (
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
          onSeekRelative={seekRelative}
          getPlaybackState={getPlaybackState}
        />
      )}
    </div>
  )
}
