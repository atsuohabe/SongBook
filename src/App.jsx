import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import SongList from './components/SongList'
import SongPage from './components/SongPage'
import AddSongPage from './components/AddSongPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<SongList />} />
        <Route path="song/:songId" element={<SongPage />} />
        <Route path="add-song" element={<AddSongPage />} />
        <Route path="edit-song/:songId" element={<AddSongPage />} />
        <Route path="callback" element={<SongList />} />
      </Route>
    </Routes>
  )
}

export default App
