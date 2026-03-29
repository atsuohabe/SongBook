import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useUserSongs, suggestLineBreaks, parseLyricsToLines } from '../hooks/useUserSongs'
import { useVocabLookup } from '../hooks/useVocabLookup'

export default function AddSongPage() {
  const { songId } = useParams()
  const navigate = useNavigate()
  const { userSongs, addUserSong, updateUserSong } = useUserSongs()
  const vocabMap = useVocabLookup()
  const isEdit = !!songId

  const existingSong = isEdit ? userSongs.find(s => s.id === songId) : null

  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [artistEn, setArtistEn] = useState('')
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [lyricsText, setLyricsText] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Load existing song data for edit mode
  useEffect(() => {
    if (existingSong) {
      setTitle(existingSong.title)
      setArtist(existingSong.artist)
      setArtistEn(existingSong.artist_en || '')
      setSpotifyUrl(existingSong.spotifyTrackUri || '')
      // Reconstruct lyrics text from lines
      const text = existingSong.lines
        .map(line => line.words.map(w => w.hanzi).join(''))
        .join('\n')
      setLyricsText(text)
    }
  }, [existingSong])

  // Parse Spotify URL for validation display
  const spotifyUri = useMemo(() => {
    if (!spotifyUrl) return ''
    if (spotifyUrl.startsWith('spotify:track:')) return spotifyUrl
    const match = spotifyUrl.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/)
    return match ? `spotify:track:${match[1]}` : ''
  }, [spotifyUrl])

  // Preview parsed lines
  const previewLines = useMemo(() => {
    if (!lyricsText.trim()) return []
    return parseLyricsToLines(lyricsText, vocabMap)
  }, [lyricsText, vocabMap])

  const handleSuggestBreaks = () => {
    setLyricsText(suggestLineBreaks(lyricsText))
  }

  const handleSave = async () => {
    if (!title.trim() || !artist.trim() || !lyricsText.trim()) return
    setSaving(true)
    try {
      const data = { title: title.trim(), artist: artist.trim(), artistEn: artistEn.trim(), spotifyUrl, lyricsText }
      if (isEdit) {
        await updateUserSong(songId, data, vocabMap)
        navigate(`/song/${songId}`)
      } else {
        const song = await addUserSong(data, vocabMap)
        navigate(`/song/${song.id}`)
      }
    } catch (e) {
      console.error('Save error:', e)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const canSave = title.trim() && artist.trim() && lyricsText.trim() && !saving

  const inputStyle = {
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link to="/" className="text-sm mb-4 inline-block no-underline" style={{ color: 'var(--color-text-muted)' }}>
        ← Back
      </Link>
      <h1 className="text-2xl font-semibold mb-6" style={{ color: 'var(--color-text)' }}>
        {isEdit ? '曲を編集' : '曲を追加'}
      </h1>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
            曲名 <span style={{ color: 'var(--color-primary)' }}>*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="例: 小手拉大手"
            className="w-full px-4 py-3 rounded-lg outline-none"
            style={inputStyle}
          />
        </div>

        {/* Artist */}
        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
            歌手名 <span style={{ color: 'var(--color-primary)' }}>*</span>
          </label>
          <input
            type="text"
            value={artist}
            onChange={e => setArtist(e.target.value)}
            placeholder="例: 梁靜茹"
            className="w-full px-4 py-3 rounded-lg outline-none"
            style={inputStyle}
          />
        </div>

        {/* Artist English */}
        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
            歌手名（英語）
          </label>
          <input
            type="text"
            value={artistEn}
            onChange={e => setArtistEn(e.target.value)}
            placeholder="例: Fish Leong"
            className="w-full px-4 py-3 rounded-lg outline-none"
            style={inputStyle}
          />
        </div>

        {/* Spotify URL */}
        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
            Spotifyリンク
          </label>
          <input
            type="text"
            value={spotifyUrl}
            onChange={e => setSpotifyUrl(e.target.value)}
            placeholder="https://open.spotify.com/track/..."
            className="w-full px-4 py-3 rounded-lg outline-none"
            style={inputStyle}
          />
          {spotifyUrl && (
            <p className="text-xs mt-1" style={{ color: spotifyUri ? 'var(--color-primary)' : '#e53935' }}>
              {spotifyUri || '無効なSpotifyリンクです'}
            </p>
          )}
        </div>

        {/* Lyrics */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              歌詞 <span style={{ color: 'var(--color-primary)' }}>*</span>
            </label>
            <button
              type="button"
              onClick={handleSuggestBreaks}
              className="text-xs px-3 py-1 rounded-full border-none cursor-pointer"
              style={{ background: 'var(--color-surface)', color: 'var(--color-pinyin)' }}
            >
              自動改行
            </button>
          </div>
          <textarea
            value={lyricsText}
            onChange={e => setLyricsText(e.target.value)}
            placeholder="歌詞をペーストしてください。改行で行を分けます。&#10;改行がない場合は「自動改行」ボタンで改行を提案します。"
            rows={12}
            className="w-full px-4 py-3 rounded-lg outline-none resize-y"
            style={{ ...inputStyle, lineHeight: 1.8, fontFamily: 'inherit' }}
          />
        </div>

        {/* Preview Toggle */}
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="w-full px-4 py-2.5 rounded-lg text-sm font-medium border-none cursor-pointer"
          style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}
        >
          {showPreview ? 'プレビューを閉じる' : 'プレビューを表示'}
        </button>

        {/* Preview */}
        {showPreview && previewLines.length > 0 && (
          <div className="rounded-lg p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
              プレビュー（{previewLines.length}行）
            </p>
            <div className="space-y-2">
              {previewLines.map((line, i) => (
                <div key={i} className="py-2 px-3 rounded" style={{ background: 'var(--color-bg)' }}>
                  {/* Meanings row */}
                  <div className="flex flex-wrap justify-center gap-x-2">
                    {line.words.map((w, j) => (
                      <span key={j} className="text-center" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: '2px 4px' }}>
                        {w.meaning && (
                          <span style={{ fontSize: '0.6rem', color: 'var(--color-meaning)', lineHeight: 1.2 }}>{w.meaning}</span>
                        )}
                        <span style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--color-text)' }}>{w.hanzi}</span>
                        {w.pinyin && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-pinyin)', lineHeight: 1.2 }}>{w.pinyin}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full px-4 py-3 rounded-lg text-base font-semibold border-none cursor-pointer transition-opacity"
          style={{
            background: 'var(--color-primary)',
            color: '#000',
            opacity: canSave ? 1 : 0.4,
          }}
        >
          {saving ? '保存中（翻訳を取得しています...）' : isEdit ? '変更を保存' : '曲を追加'}
        </button>
      </div>
    </div>
  )
}
