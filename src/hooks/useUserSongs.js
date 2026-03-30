import { useState, useCallback } from 'react'
import { pinyin } from 'pinyin-pro'

const STORAGE_KEY = 'songbook-user-songs'
const TRASH_KEY = 'songbook-user-songs-trash'
const HIDDEN_KEY = 'songbook-hidden-songs'

// Segment Chinese text into words using Intl.Segmenter
function segmentChinese(text) {
  if (!text) return []
  try {
    const segmenter = new Intl.Segmenter('zh', { granularity: 'word' })
    return Array.from(segmenter.segment(text))
      .filter(s => s.isWordLike)
      .map(s => s.segment)
  } catch {
    // Fallback: return each character individually
    return text.split('').filter(c => c.trim())
  }
}

// Generate pinyin for a Chinese word
function getPinyin(word) {
  try {
    return pinyin(word, { toneType: 'symbol' })
  } catch {
    return ''
  }
}

// Auto-suggest line breaks for lyrics without newlines
function suggestLineBreaks(text) {
  if (text.includes('\n')) return text
  // Split on Chinese punctuation
  return text
    .replace(/([，,。！？、；])/g, '$1\n')
    .replace(/\n+/g, '\n')
    .trim()
}

// Parse raw lyrics text into the song lines structure
function parseLyricsToLines(text, vocabMap) {
  const lines = text.split('\n')
  return lines.map(lineText => {
    const trimmed = lineText.trim()
    if (!trimmed) {
      return { startTime: null, endTime: null, section: null, translation: null, words: [] }
    }

    // Check if line is non-Chinese (LALALA, interlude markers, etc.)
    const isChinese = /[\u4e00-\u9fff]/.test(trimmed)

    if (!isChinese) {
      return {
        startTime: null,
        endTime: null,
        section: null,
        translation: null,
        words: [{ hanzi: trimmed, pinyin: '', meaning: '' }],
      }
    }

    const segments = segmentChinese(trimmed)
    const words = segments.map(seg => ({
      hanzi: seg,
      pinyin: getPinyin(seg),
      meaning: vocabMap?.[seg]?.meaning_en || '',
    }))

    return {
      startTime: null,
      endTime: null,
      section: null,
      translation: null,
      words,
    }
  }).filter(line => line.words.length > 0)
}

// Extract Spotify track ID from various URL formats
function parseSpotifyUrl(input) {
  if (!input) return ''
  // Already a URI
  if (input.startsWith('spotify:track:')) return input
  // URL format
  const match = input.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/)
  if (match) return `spotify:track:${match[1]}`
  return ''
}

// Translate a line using MyMemory API (free, no API key)
async function translateLine(text) {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=zh-TW|en`
    )
    const data = await res.json()
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translation = data.responseData.translatedText
      // MyMemory returns UPPERCASE when uncertain; capitalize normally instead
      if (translation === translation.toUpperCase() && translation.length > 3) {
        return translation.charAt(0) + translation.slice(1).toLowerCase()
      }
      return translation
    }
  } catch {
    // Translation failed, return empty
  }
  return ''
}

// Translate all lines and return updated lines array
async function translateLines(lines) {
  const results = []
  for (const line of lines) {
    if (line.words.length === 0) {
      results.push(line)
      continue
    }
    const hanziText = line.words.map(w => w.hanzi).join('')
    const isChinese = /[\u4e00-\u9fff]/.test(hanziText)
    if (!isChinese) {
      results.push(line)
      continue
    }
    const translation = await translateLine(hanziText)
    results.push({ ...line, translation })
  }
  return results
}

function loadUserSongs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveUserSongs(songs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(songs))
}

function loadTrash() {
  try {
    const raw = localStorage.getItem(TRASH_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveTrash(songs) {
  localStorage.setItem(TRASH_KEY, JSON.stringify(songs))
}

function loadHiddenSongs() {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHiddenSongs(ids) {
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(ids))
}

export function useUserSongs() {
  const [userSongs, setUserSongs] = useState(loadUserSongs)
  const [trashedSongs, setTrashedSongs] = useState(loadTrash)
  const [hiddenSongIds, setHiddenSongIds] = useState(loadHiddenSongs)

  const addUserSong = useCallback(async (data, vocabMap) => {
    const { title, artist, artistEn, spotifyUrl, lyricsText } = data
    const lines = parseLyricsToLines(lyricsText, vocabMap)
    const translatedLines = await translateLines(lines)
    const song = {
      id: `user-${Date.now()}`,
      title,
      title_pinyin: getPinyin(title),
      title_meaning: '',
      artist,
      artist_pinyin: getPinyin(artist),
      artist_en: artistEn || '',
      album: '',
      spotifyTrackUri: parseSpotifyUrl(spotifyUrl),
      isUserSong: true,
      lines: translatedLines,
    }
    const updated = [...loadUserSongs(), song]
    saveUserSongs(updated)
    setUserSongs(updated)
    return song
  }, [])

  const updateUserSong = useCallback(async (id, data, vocabMap) => {
    const { title, artist, artistEn, spotifyUrl, lyricsText } = data
    const lines = parseLyricsToLines(lyricsText, vocabMap)
    const translatedLines = await translateLines(lines)
    const current = loadUserSongs()
    const updated = current.map(s => {
      if (s.id !== id) return s
      return {
        ...s,
        title,
        title_pinyin: getPinyin(title),
        artist,
        artist_pinyin: getPinyin(artist),
        artist_en: artistEn || '',
        spotifyTrackUri: parseSpotifyUrl(spotifyUrl),
        lines: translatedLines,
      }
    })
    saveUserSongs(updated)
    setUserSongs(updated)
  }, [])

  // Move user song to trash instead of permanent delete
  const deleteUserSong = useCallback((id) => {
    const current = loadUserSongs()
    const songToTrash = current.find(s => s.id === id)
    if (songToTrash) {
      const trash = loadTrash()
      songToTrash.deletedAt = Date.now()
      saveTrash([...trash, songToTrash])
      setTrashedSongs([...trash, songToTrash])
    }
    const updated = current.filter(s => s.id !== id)
    saveUserSongs(updated)
    setUserSongs(updated)
  }, [])

  // Restore a user song from trash
  const restoreUserSong = useCallback((id) => {
    const trash = loadTrash()
    const songToRestore = trash.find(s => s.id === id)
    if (songToRestore) {
      delete songToRestore.deletedAt
      const current = loadUserSongs()
      saveUserSongs([...current, songToRestore])
      setUserSongs([...current, songToRestore])
    }
    const updatedTrash = trash.filter(s => s.id !== id)
    saveTrash(updatedTrash)
    setTrashedSongs(updatedTrash)
  }, [])

  // Permanently delete from trash
  const permanentDeleteSong = useCallback((id) => {
    const trash = loadTrash()
    const updated = trash.filter(s => s.id !== id)
    saveTrash(updated)
    setTrashedSongs(updated)
  }, [])

  // Hide a built-in song
  const hideSong = useCallback((id) => {
    const current = loadHiddenSongs()
    if (!current.includes(id)) {
      const updated = [...current, id]
      saveHiddenSongs(updated)
      setHiddenSongIds(updated)
    }
  }, [])

  // Show a previously hidden built-in song
  const unhideSong = useCallback((id) => {
    const current = loadHiddenSongs()
    const updated = current.filter(i => i !== id)
    saveHiddenSongs(updated)
    setHiddenSongIds(updated)
  }, [])

  return {
    userSongs, addUserSong, updateUserSong, deleteUserSong,
    trashedSongs, restoreUserSong, permanentDeleteSong,
    hiddenSongIds, hideSong, unhideSong,
  }
}

export { suggestLineBreaks, parseLyricsToLines }
