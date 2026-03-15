# SongBook - 中国語歌詞学習アプリ

中国語の歌を通じて語彙を学ぶWebアプリケーションです。

## 機能

- **Study Mode**: 歌詞にピンインと英語の意味をオーバーレイ表示（トグル切替可能）
- **Listening Mode**: Spotify Web Playback SDK連携で歌詞を自動スクロール
- **単語検索**: taiwan-flashcard 8000+語のデータベースから語彙を検索
- **単語詳細ポップアップ**: タップでTOCFLレベル・MDBG辞書リンクを表示
- **曲検索**: タイトル・アーティスト名で検索
- **レスポンシブデザイン**: デスクトップ・モバイル対応

## 収録曲

- 周杰倫「搁浅」(Stranded)

## セットアップ

```bash
npm install
npm run dev
```

## 技術スタック

- React + Vite
- Tailwind CSS
- Spotify Web Playback SDK
