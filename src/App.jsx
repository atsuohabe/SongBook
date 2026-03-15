import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import SongList from './components/SongList'
import SongPage from './components/SongPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<SongList />} />
        <Route path="song/:songId" element={<SongPage />} />
        <Route path="callback" element={<SongList />} />
      </Route>
    </Routes>
  )
}

export default App
