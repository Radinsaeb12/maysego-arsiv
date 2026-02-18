import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

// ─── HELPERS ────────────────────────────────────────────────────────────────
function fmtNum(n) {
  n = parseInt(n) || 0;
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString('tr-TR');
}

function fmtDur(iso) {
  if (!iso) return '';
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '';
  const h = +m[1] || 0, min = +m[2] || 0, s = +m[3] || 0;
  if (h) return `${h}:${String(min).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${min}:${String(s).padStart(2,'0')}`;
}

function durSec(iso) {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (+m[1]||0)*3600 + (+m[2]||0)*60 + (+m[3]||0);
}

function fmtDate(iso, lang='tr') {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-GB',
    { day:'numeric', month:'long', year:'numeric' });
}

function timeAgo(iso, lang='tr') {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return lang==='tr' ? 'Az önce' : 'Just now';
  if (diff < 3600) { const m=Math.floor(diff/60); return lang==='tr' ? `${m} dakika önce` : `${m}m ago`; }
  if (diff < 86400) { const h=Math.floor(diff/3600); return lang==='tr' ? `${h} saat önce` : `${h}h ago`; }
  if (diff < 2592000) { const d=Math.floor(diff/86400); return lang==='tr' ? `${d} gün önce` : `${d}d ago`; }
  if (diff < 31536000) { const mo=Math.floor(diff/2592000); return lang==='tr' ? `${mo} ay önce` : `${mo}mo ago`; }
  const y=Math.floor(diff/31536000); return lang==='tr' ? `${y} yıl önce` : `${y}y ago`;
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── TRANSLATIONS ────────────────────────────────────────────────────────────
const T = {
  tr: {
    search: 'Video ara...', all: 'Tümü', videos: 'Videolar', live: 'Canlı',
    newest: '↓ En Yeni', oldest: '↑ En Eski', mostViewed: '👁 En Çok İzlenen',
    mostLiked: '👍 En Beğenilen', longest: '⏱ En Uzun',
    durAll: 'Süre: Tümü', durShort: 'Kısa (<4dk)', durMed: 'Orta (4-20dk)', durLong: 'Uzun (>20dk)',
    small: 'Küçük', medium: 'Orta', large: 'Büyük',
    favorites: '💖 Favorilerim', playlists: '📋 Playlistlerim', tags: '🏷️ Etiketler',
    analytics: '📊 İstatistikler', compare: '⚖️ Karşılaştır', export: '📥 Dışa Aktar',
    theme: 'Tema', refresh: '🔄 Yenile', loading: 'Yükleniyor...', noResults: 'Sonuç bulunamadı',
    subs: 'Abone', totalViews: 'Toplam İzlenme', videoCount: 'Video',
    views: 'İzlenme', likes: 'Beğeni', comments: 'Yorum', duration: 'Süre',
    watched: 'İzledim', addFav: 'Favori', note: 'Not', addPlaylist: 'Playlist',
    qr: 'QR Kod', share: 'Paylaş', copy: 'Kopyala', copied: 'Kopyalandı!',
    top10: '🏆 En Çok İzlenen 10 Video', clearFilters: 'Filtreleri Temizle',
    exportCSV: '📊 CSV', exportM3U: '🎵 M3U Playlist', exportPDF: '📄 PDF',
    backup: '💾 Yedek Al', restore: '📤 Geri Yükle',
    compareMode: 'Karşılaştırma modu — 2 video seçin',
    compareTitle: '⚖️ Video Karşılaştırması',
    favTitle: '💖 Favori Videolarım', favEmpty: 'Henüz favori yok',
    plTitle: '📋 Playlistlerim', plEmpty: 'Henüz playlist yok',
    plCreate: '➕ Yeni Playlist', plName: 'Playlist adı:',
    tagTitle: '🏷️ Etiket Yöneticisi', tagAdd: 'Etiket ekle...', tagAddBtn: 'Ekle',
    analyticsTitle: '📊 Gelişmiş İstatistikler',
    qrTitle: '📱 QR Kod', backupTitle: '💾 Yedekleme & Geri Yükleme',
    noteTitle: 'Not Ekle', noteSave: 'Kaydet', noteDelete: 'Sil',
    liveNow: '🔴 CANLI', upcoming: '🔔 Yakında',
    m3uModal: '🎵 M3U Format Seç',
    lastUpdate: 'Son güncelleme',
    showing: 'video gösteriliyor',
    keyJ: 'Sonraki', keyK: 'Önceki', keyF: 'Favori', keyQ: 'Yardım',
  },
  en: {
    search: 'Search videos...', all: 'All', videos: 'Videos', live: 'Live',
    newest: '↓ Newest', oldest: '↑ Oldest', mostViewed: '👁 Most Viewed',
    mostLiked: '👍 Most Liked', longest: '⏱ Longest',
    durAll: 'Duration: All', durShort: 'Short (<4min)', durMed: 'Medium (4-20min)', durLong: 'Long (>20min)',
    small: 'Small', medium: 'Medium', large: 'Large',
    favorites: '💖 Favorites', playlists: '📋 Playlists', tags: '🏷️ Tags',
    analytics: '📊 Analytics', compare: '⚖️ Compare', export: '📥 Export',
    theme: 'Theme', refresh: '🔄 Refresh', loading: 'Loading...', noResults: 'No results found',
    subs: 'Subscribers', totalViews: 'Total Views', videoCount: 'Videos',
    views: 'Views', likes: 'Likes', comments: 'Comments', duration: 'Duration',
    watched: 'Watched', addFav: 'Favorite', note: 'Note', addPlaylist: 'Playlist',
    qr: 'QR Code', share: 'Share', copy: 'Copy', copied: 'Copied!',
    top10: '🏆 Top 10 Most Viewed', clearFilters: 'Clear Filters',
    exportCSV: '📊 CSV', exportM3U: '🎵 M3U Playlist', exportPDF: '📄 PDF',
    backup: '💾 Backup', restore: '📤 Restore',
    compareMode: 'Compare mode — select 2 videos',
    compareTitle: '⚖️ Video Comparison',
    favTitle: '💖 My Favorites', favEmpty: 'No favorites yet',
    plTitle: '📋 My Playlists', plEmpty: 'No playlists yet',
    plCreate: '➕ New Playlist', plName: 'Playlist name:',
    tagTitle: '🏷️ Tag Manager', tagAdd: 'Add tag...', tagAddBtn: 'Add',
    analyticsTitle: '📊 Advanced Analytics',
    qrTitle: '📱 QR Code', backupTitle: '💾 Backup & Restore',
    noteTitle: 'Add Note', noteSave: 'Save', noteDelete: 'Delete',
    liveNow: '🔴 LIVE', upcoming: '🔔 Upcoming',
    m3uModal: '🎵 Select M3U Format',
    lastUpdate: 'Last updated',
    showing: 'videos showing',
    keyJ: 'Next', keyK: 'Prev', keyF: 'Favorite', keyQ: 'Help',
  }
};

// ─── STYLES ─────────────────────────────────────────────────────────────────
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #080b1a;
    --bg2: #0d1128;
    --card: #111827;
    --card2: #1a2235;
    --border: rgba(255,255,255,0.07);
    --accent: #6366f1;
    --accent2: #8b5cf6;
    --cyan: #06b6d4;
    --pink: #ec4899;
    --green: #10b981;
    --yellow: #f59e0b;
    --text: #f1f5f9;
    --text2: #94a3b8;
    --text3: #64748b;
    --grad1: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ec4899 100%);
    --grad2: linear-gradient(135deg, #6366f1, #8b5cf6);
    --shadow: 0 4px 24px rgba(0,0,0,0.4);
    --shadow-lg: 0 16px 48px rgba(0,0,0,0.6);
    --radius: 14px;
    --radius-sm: 8px;
    --radius-xl: 22px;
    font-family: 'Inter', system-ui, sans-serif;
  }
  body.light {
    --bg: #f1f5f9; --bg2: #e2e8f0; --card: #ffffff; --card2: #f8fafc;
    --border: rgba(0,0,0,0.08); --text: #0f172a; --text2: #475569; --text3: #94a3b8;
    --shadow: 0 4px 24px rgba(0,0,0,0.08); --shadow-lg: 0 16px 48px rgba(0,0,0,0.12);
  }
  body { background: var(--bg); color: var(--text); transition: background .3s, color .3s; min-height: 100vh; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg2); }
  ::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 3px; }

  /* HEADER */
  .hdr { position: relative; overflow: hidden; padding: 0; }
  .hdr-banner { width:100%; height:220px; object-fit:cover; display:block; }
  .hdr-banner-placeholder { width:100%; height:220px; background: var(--grad1); }
  .hdr-overlay { position:absolute; inset:0; background: linear-gradient(to bottom, rgba(8,11,26,.3) 0%, rgba(8,11,26,.85) 100%); }
  .hdr-content { position:absolute; bottom:0; left:0; right:0; padding: 1.5rem 2rem; display:flex; align-items:flex-end; gap:1.5rem; }
  .hdr-avatar { width:90px; height:90px; border-radius:50%; border:3px solid var(--accent); object-fit:cover; box-shadow: 0 0 0 4px rgba(99,102,241,.3), var(--shadow); flex-shrink:0; }
  .hdr-info { flex:1; min-width:0; }
  .hdr-name { font-size:2rem; font-weight:800; line-height:1.1; text-shadow: 0 2px 8px rgba(0,0,0,.5); color:#fff; }
  .hdr-sub { font-size:.85rem; color:rgba(255,255,255,.75); margin-top:.3rem; }
  .hdr-actions { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; flex-shrink:0; }
  .hdr-btn { background:rgba(255,255,255,.15); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,.2); color:#fff; padding:.5rem .9rem; border-radius:20px; font-size:.8rem; cursor:pointer; transition:all .2s; font-weight:500; white-space:nowrap; }
  .hdr-btn:hover { background:rgba(255,255,255,.25); }
  .hdr-btn.active-lang { background:var(--accent); border-color:var(--accent); }

  /* STATS STRIP */
  .stats-strip { background: var(--bg2); border-bottom: 1px solid var(--border); padding: .75rem 2rem; display:flex; gap:2rem; overflow-x:auto; }
  .stats-strip::-webkit-scrollbar { height:3px; }
  .stat-item { display:flex; align-items:center; gap:.6rem; white-space:nowrap; flex-shrink:0; }
  .stat-icon { font-size:1.1rem; }
  .stat-val { font-size:1rem; font-weight:700; color:var(--accent); }
  .stat-lbl { font-size:.75rem; color:var(--text2); }
  .stat-sep { width:1px; height:24px; background:var(--border); flex-shrink:0; }

  /* YEAR STATS */
  .year-stats { background:var(--bg2); border-bottom:1px solid var(--border); padding:.6rem 2rem; display:flex; gap:.6rem; overflow-x:auto; }
  .year-chip { background:var(--card); border:1px solid var(--border); border-radius:20px; padding:.35rem .9rem; font-size:.78rem; color:var(--text2); cursor:pointer; transition:all .2s; white-space:nowrap; flex-shrink:0; }
  .year-chip:hover { border-color:var(--accent); color:var(--text); }
  .year-chip.active { background:var(--grad2); border-color:transparent; color:#fff; font-weight:600; }
  .year-chip-views { font-size:.68rem; color:var(--cyan); margin-left:.3rem; }

  /* TOP 10 BANNER */
  .top10-section { background:linear-gradient(135deg,rgba(99,102,241,.08),rgba(139,92,246,.05)); border-bottom:1px solid var(--border); padding:1.2rem 2rem; }
  .top10-title { font-size:.9rem; font-weight:700; color:var(--text2); margin-bottom:.8rem; letter-spacing:.05em; text-transform:uppercase; }
  .top10-scroll { display:flex; gap:.8rem; overflow-x:auto; padding-bottom:.5rem; }
  .top10-scroll::-webkit-scrollbar { height:3px; }
  .top10-card { flex-shrink:0; width:160px; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); overflow:hidden; cursor:pointer; transition:all .2s; position:relative; }
  .top10-card:hover { transform:translateY(-3px); box-shadow:var(--shadow); border-color:var(--accent); }
  .top10-rank { position:absolute; top:6px; left:6px; background:var(--grad2); color:#fff; font-size:.7rem; font-weight:800; padding:2px 7px; border-radius:10px; z-index:1; }
  .top10-thumb { width:100%; aspect-ratio:16/9; object-fit:cover; display:block; }
  .top10-info { padding:.5rem; }
  .top10-title-txt { font-size:.72rem; font-weight:600; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .top10-views { font-size:.65rem; color:var(--cyan); margin-top:.25rem; }

  /* TOOLBAR */
  .toolbar { background:var(--bg2); border-bottom:1px solid var(--border); padding:.9rem 2rem; display:flex; flex-direction:column; gap:.7rem; position:sticky; top:0; z-index:50; }
  .toolbar-row { display:flex; gap:.6rem; flex-wrap:wrap; align-items:center; }
  .search-wrap { flex:1; min-width:200px; position:relative; }
  .search-wrap input { width:100%; background:var(--card); border:2px solid var(--border); color:var(--text); border-radius:var(--radius-xl); padding:.65rem 1.2rem .65rem 2.6rem; font-size:.9rem; transition:border-color .2s; font-family:inherit; }
  .search-wrap input:focus { outline:none; border-color:var(--accent); }
  .search-wrap input::placeholder { color:var(--text3); }
  .search-icon { position:absolute; left:.9rem; top:50%; transform:translateY(-50%); font-size:1rem; pointer-events:none; }
  .tb-btn { background:var(--card); border:2px solid var(--border); color:var(--text); border-radius:var(--radius-xl); padding:.55rem 1rem; font-size:.82rem; cursor:pointer; transition:all .2s; font-weight:500; white-space:nowrap; font-family:inherit; }
  .tb-btn:hover { border-color:var(--accent); color:var(--accent); }
  .tb-btn.active { background:var(--grad2); border-color:transparent; color:#fff; font-weight:600; }
  .tb-btn.danger { border-color:rgba(236,72,153,.3); }
  .tb-btn.danger:hover { background:var(--pink); border-color:var(--pink); color:#fff; }
  .tb-select { background:var(--card); border:2px solid var(--border); color:var(--text); border-radius:var(--radius-xl); padding:.55rem 1rem; font-size:.82rem; cursor:pointer; transition:border-color .2s; font-family:inherit; }
  .tb-select:focus { outline:none; border-color:var(--accent); }
  .date-input { background:var(--card); border:2px solid var(--border); color:var(--text); border-radius:var(--radius-xl); padding:.55rem 1rem; font-size:.82rem; cursor:pointer; font-family:inherit; }
  .date-input:focus { outline:none; border-color:var(--accent); }
  .count-label { color:var(--text3); font-size:.78rem; margin-left:auto; white-space:nowrap; }

  /* FLOAT BUTTONS */
  .floats { position:fixed; bottom:1.5rem; right:1.5rem; display:flex; flex-direction:column; gap:.6rem; z-index:80; }
  .float-btn { background:var(--card); border:2px solid var(--border); color:var(--text); border-radius:14px; padding:.7rem 1rem; font-size:.82rem; cursor:pointer; font-weight:600; transition:all .2s; text-align:center; box-shadow:var(--shadow); font-family:inherit; white-space:nowrap; }
  .float-btn:hover { background:var(--card2); border-color:var(--accent); transform:translateX(-3px); }
  .float-btn.pink:hover { background:var(--pink); border-color:var(--pink); color:#fff; }
  .float-btn.purple:hover { background:var(--accent); border-color:var(--accent); color:#fff; }
  .fav-count { display:inline-block; background:var(--pink); color:#fff; border-radius:10px; padding:0 6px; font-size:.7rem; margin-left:.3rem; }

  /* EXPORT DROPDOWN */
  .export-wrap { position:relative; }
  .export-menu { position:absolute; bottom:calc(100% + .5rem); right:0; background:var(--card); border:2px solid var(--border); border-radius:var(--radius); overflow:hidden; box-shadow:var(--shadow-lg); min-width:180px; display:none; }
  .export-wrap.open .export-menu { display:block; }
  .export-item { padding:.75rem 1.1rem; font-size:.85rem; cursor:pointer; transition:background .15s; display:flex; align-items:center; gap:.6rem; }
  .export-item:hover { background:var(--card2); }

  /* GRID */
  .grid-wrap { padding:1.2rem 2rem; }
  .vid-grid { display:grid; gap:1rem; }
  .vid-grid.small { grid-template-columns: repeat(auto-fill,minmax(180px,1fr)); }
  .vid-grid.medium { grid-template-columns: repeat(auto-fill,minmax(280px,1fr)); }
  .vid-grid.large { grid-template-columns: repeat(auto-fill,minmax(360px,1fr)); }

  /* VIDEO CARD */
  .vcard { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; cursor:pointer; transition:all .22s; position:relative; }
  .vcard:hover { transform:translateY(-5px); box-shadow:0 16px 40px rgba(0,0,0,.4); border-color:rgba(99,102,241,.35); }
  .vcard.live-card { border-color:rgba(236,72,153,.5); box-shadow:0 0 24px rgba(236,72,153,.15); }
  .vcard.selected-card { border-color:var(--cyan); box-shadow:0 0 20px rgba(6,182,212,.2); }
  .vcard.watched-card { opacity:.7; }
  .vcard.watched-card .vthumb img { filter:grayscale(30%); }

  .vthumb { position:relative; aspect-ratio:16/9; overflow:hidden; background:#000; }
  .vthumb img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .3s; }
  .vcard:hover .vthumb img { transform:scale(1.04); }
  .vdur { position:absolute; bottom:6px; right:6px; background:rgba(0,0,0,.82); color:#fff; font-size:.7rem; padding:2px 7px; border-radius:5px; font-weight:600; }
  .vlive-tag { position:absolute; top:8px; left:8px; background:var(--pink); color:#fff; font-size:.68rem; padding:3px 8px; border-radius:5px; font-weight:700; display:flex; align-items:center; gap:.3rem; }
  .vlive-dot { width:6px; height:6px; background:#fff; border-radius:50%; animation:blink 1.2s infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
  .vwatched-tag { position:absolute; top:8px; left:8px; background:rgba(16,185,129,.9); color:#fff; font-size:.65rem; padding:2px 7px; border-radius:5px; font-weight:600; }
  .vnote-dot { position:absolute; top:8px; right:8px; background:var(--yellow); width:10px; height:10px; border-radius:50%; border:2px solid var(--card); }
  .vtag-badges { position:absolute; bottom:6px; left:6px; display:flex; gap:.3rem; flex-wrap:wrap; max-width:80%; }
  .vtag-badge { background:rgba(99,102,241,.8); color:#fff; font-size:.6rem; padding:1px 6px; border-radius:10px; }

  .vbody { padding:.8rem; }
  .vtitle { font-size:.88rem; font-weight:600; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin-bottom:.5rem; }
  .vmeta { display:flex; gap:.7rem; color:var(--text2); font-size:.75rem; flex-wrap:wrap; }
  .vmeta span { display:flex; align-items:center; gap:.2rem; }
  .vdate { color:var(--text3); font-size:.72rem; margin-top:.3rem; }
  .vlive-viewers { color:var(--pink); font-weight:600; }

  /* CARD ACTIONS */
  .vactions { display:flex; gap:.4rem; padding:.5rem .8rem .8rem; flex-wrap:wrap; }
  .vact-btn { background:var(--card2); border:1px solid var(--border); color:var(--text2); border-radius:8px; padding:.3rem .6rem; font-size:.72rem; cursor:pointer; transition:all .15s; font-family:inherit; white-space:nowrap; }
  .vact-btn:hover { border-color:var(--accent); color:var(--accent); }
  .vact-btn.fav-active { background:rgba(236,72,153,.15); border-color:var(--pink); color:var(--pink); }
  .vact-btn.watch-active { background:rgba(16,185,129,.15); border-color:var(--green); color:var(--green); }
  .more-menu { position:absolute; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); overflow:hidden; z-index:30; box-shadow:var(--shadow); min-width:130px; display:none; }
  .more-menu.open { display:block; }
  .more-item { padding:.55rem .9rem; font-size:.8rem; cursor:pointer; transition:background .15s; }
  .more-item:hover { background:var(--card2); }

  /* PL SELECTOR */
  .pl-selector { position:absolute; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); z-index:40; box-shadow:var(--shadow-lg); min-width:160px; overflow:hidden; display:none; }
  .pl-selector.open { display:block; }
  .pl-opt { padding:.55rem .9rem; font-size:.8rem; cursor:pointer; transition:background .15s; }
  .pl-opt:hover { background:var(--card2); }

  /* MODAL */
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.7); backdrop-filter:blur(6px); z-index:100; display:flex; align-items:center; justify-content:center; padding:1rem; opacity:0; pointer-events:none; transition:opacity .25s; }
  .modal-overlay.open { opacity:1; pointer-events:all; }
  .modal-box { background:var(--card); border:1px solid var(--border); border-radius:18px; width:100%; max-width:860px; max-height:90vh; display:flex; flex-direction:column; box-shadow:var(--shadow-lg); transform:scale(.95); transition:transform .25s; overflow:hidden; }
  .modal-overlay.open .modal-box { transform:scale(1); }
  .modal-box.sm { max-width:480px; }
  .modal-box.xl { max-width:1100px; }
  .modal-hdr { padding:1.2rem 1.5rem; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
  .modal-hdr h2 { font-size:1.1rem; font-weight:700; }
  .modal-close { background:var(--card2); border:1px solid var(--border); color:var(--text); width:32px; height:32px; border-radius:8px; cursor:pointer; font-size:1.1rem; display:flex; align-items:center; justify-content:center; transition:all .2s; }
  .modal-close:hover { background:var(--pink); border-color:var(--pink); color:#fff; }
  .modal-body { padding:1.2rem 1.5rem; overflow-y:auto; flex:1; }

  /* ANALYTICS CHARTS */
  .charts-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
  .chart-card { background:var(--card2); border:1px solid var(--border); border-radius:var(--radius); padding:1.2rem; }
  .chart-card h3 { font-size:.85rem; font-weight:600; color:var(--text2); margin-bottom:1rem; text-transform:uppercase; letter-spacing:.05em; }
  .chart-container { height:200px; position:relative; }
  .stat-cards-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:.8rem; margin-bottom:1.2rem; }
  .stat-card { background:var(--card2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:1rem; text-align:center; }
  .stat-card-val { font-size:1.4rem; font-weight:800; background:var(--grad2); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .stat-card-lbl { font-size:.72rem; color:var(--text3); margin-top:.3rem; }

  /* COMPARE */
  .compare-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; }
  .compare-col { background:var(--card2); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; }
  .compare-thumb { width:100%; aspect-ratio:16/9; object-fit:cover; display:block; }
  .compare-info { padding:1rem; }
  .compare-title { font-size:.95rem; font-weight:700; margin-bottom:.8rem; }
  .compare-row { display:flex; justify-content:space-between; align-items:center; padding:.4rem 0; border-bottom:1px solid var(--border); font-size:.82rem; }
  .compare-row:last-child { border:none; }
  .compare-row .lbl { color:var(--text2); }
  .compare-row .val { font-weight:600; }
  .compare-winner { color:var(--green); }
  .compare-loser { color:var(--text3); }

  /* FAVORITES / PLAYLISTS GRID */
  .modal-vid-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:.8rem; }
  .modal-vcard { background:var(--card2); border:1px solid var(--border); border-radius:var(--radius-sm); overflow:hidden; cursor:pointer; transition:all .2s; }
  .modal-vcard:hover { border-color:var(--accent); transform:translateY(-2px); }
  .pl-cards-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:.8rem; }
  .pl-card { background:var(--card2); border:2px solid var(--border); border-radius:var(--radius); padding:1.2rem; cursor:pointer; transition:all .2s; }
  .pl-card:hover { border-color:var(--accent); transform:translateY(-2px); }
  .pl-card-name { font-weight:700; font-size:.9rem; margin-bottom:.4rem; }
  .pl-card-count { font-size:.78rem; color:var(--text2); }
  .pl-controls { display:flex; gap:.6rem; margin-bottom:1rem; flex-wrap:wrap; }

  /* TAGS */
  .tag-input-row { display:flex; gap:.6rem; margin-bottom:1rem; }
  .tag-input-field { flex:1; background:var(--card2); border:2px solid var(--border); color:var(--text); border-radius:var(--radius-sm); padding:.6rem .9rem; font-size:.85rem; font-family:inherit; }
  .tag-input-field:focus { outline:none; border-color:var(--accent); }
  .tag-list-wrap { display:flex; flex-wrap:wrap; gap:.5rem; }
  .tag-chip { background:rgba(99,102,241,.15); border:1px solid rgba(99,102,241,.3); color:var(--text); border-radius:20px; padding:.3rem .8rem; font-size:.78rem; display:flex; align-items:center; gap:.4rem; }
  .tag-chip-del { cursor:pointer; color:var(--text3); transition:color .15s; }
  .tag-chip-del:hover { color:var(--pink); }
  .tag-selector-wrap { display:flex; flex-wrap:wrap; gap:.5rem; margin-top:.5rem; }
  .tag-sel-chip { background:var(--card2); border:1px solid var(--border); border-radius:20px; padding:.3rem .8rem; font-size:.75rem; cursor:pointer; transition:all .15s; }
  .tag-sel-chip:hover { border-color:var(--accent); }
  .tag-sel-chip.on { background:rgba(99,102,241,.2); border-color:var(--accent); color:var(--accent); }

  /* NOTE */
  .note-textarea { width:100%; background:var(--card2); border:2px solid var(--border); color:var(--text); border-radius:var(--radius-sm); padding:.8rem; font-size:.85rem; font-family:inherit; resize:vertical; min-height:100px; }
  .note-textarea:focus { outline:none; border-color:var(--accent); }
  .note-actions { display:flex; gap:.6rem; margin-top:.8rem; }

  /* QR */
  .qr-wrap { display:flex; flex-direction:column; align-items:center; gap:1.2rem; padding:1rem; }
  .qr-canvas-wrap { background:#fff; padding:16px; border-radius:12px; }
  .share-btns { display:flex; gap:.6rem; flex-wrap:wrap; justify-content:center; }
  .share-btn { border:none; color:#fff; padding:.6rem 1.1rem; border-radius:20px; cursor:pointer; font-size:.83rem; font-weight:600; transition:opacity .2s; font-family:inherit; }
  .share-btn:hover { opacity:.85; }
  .share-tw { background:#1da1f2; }
  .share-fb { background:#1877f2; }
  .share-wa { background:#25d366; }
  .share-cp { background:var(--text3); }

  /* BACKUP */
  .backup-section { display:flex; flex-direction:column; gap:1.2rem; }
  .backup-block { background:var(--card2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:1.2rem; }
  .backup-block h3 { font-size:.9rem; font-weight:700; margin-bottom:.5rem; }
  .backup-block p { font-size:.8rem; color:var(--text2); margin-bottom:.8rem; }
  .backup-btns { display:flex; gap:.6rem; flex-wrap:wrap; }

  /* M3U MODAL */
  .m3u-options { display:flex; flex-direction:column; gap:.8rem; }
  .m3u-opt { background:var(--card2); border:2px solid var(--border); border-radius:var(--radius); padding:1rem 1.2rem; cursor:pointer; transition:all .2s; }
  .m3u-opt:hover { border-color:var(--accent); transform:translateX(4px); }
  .m3u-opt-name { font-weight:700; font-size:.92rem; margin-bottom:.3rem; }
  .m3u-opt-url { font-size:.75rem; color:var(--cyan); font-family:monospace; margin-bottom:.2rem; }
  .m3u-opt-desc { font-size:.73rem; color:var(--text3); }

  /* KEYBOARD HINTS */
  .kb-hints { position:fixed; bottom:1.5rem; left:50%; transform:translateX(-50%); background:rgba(17,24,39,.9); backdrop-filter:blur(10px); border:1px solid var(--border); border-radius:var(--radius); padding:.6rem 1.2rem; display:flex; gap:1rem; font-size:.75rem; color:var(--text2); z-index:70; pointer-events:none; }
  .kb-key { background:var(--card2); border:1px solid var(--border); border-radius:5px; padding:1px 7px; font-weight:700; color:var(--text); margin-right:.3rem; font-size:.72rem; }

  /* THUMBNAIL HOVER PREVIEW */
  .thumb-preview { position:fixed; pointer-events:none; z-index:200; border-radius:var(--radius-sm); overflow:hidden; box-shadow:var(--shadow-lg); border:2px solid var(--accent); transition:opacity .15s; opacity:0; width:280px; }
  .thumb-preview.show { opacity:1; }

  /* COMPARE BANNER */
  .compare-banner { position:fixed; top:0; left:0; right:0; background:rgba(6,182,212,.9); backdrop-filter:blur(10px); color:#fff; padding:.7rem 1.5rem; font-size:.85rem; font-weight:600; z-index:60; display:flex; align-items:center; justify-content:space-between; }
  .compare-cancel { background:rgba(255,255,255,.2); border:none; color:#fff; padding:.3rem .8rem; border-radius:10px; cursor:pointer; font-family:inherit; font-size:.8rem; }

  /* LOADING / EMPTY */
  .center { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:40vh; gap:1rem; color:var(--text2); text-align:center; padding:2rem; }
  .spinner { width:44px; height:44px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin .8s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .empty-icon { font-size:3rem; margin-bottom:.5rem; }

  /* RESPONSIVE */
  @media(max-width:768px) {
    .hdr-content { flex-direction:column; align-items:flex-start; gap:.8rem; padding:1rem; }
    .hdr-name { font-size:1.5rem; }
    .grid-wrap { padding:.8rem; }
    .vid-grid.medium { grid-template-columns:1fr 1fr; }
    .vid-grid.large { grid-template-columns:1fr; }
    .charts-grid { grid-template-columns:1fr; }
    .compare-grid { grid-template-columns:1fr; }
    .toolbar { padding:.7rem 1rem; }
    .stats-strip { padding:.6rem 1rem; }
    .floats { bottom:1rem; right:.8rem; }
    .hdr-banner, .hdr-banner-placeholder { height:140px; }
    .hdr-avatar { width:70px; height:70px; }
  }
`;

// ──────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // UI state
  const [lang, setLang] = useState('tr');
  const [theme, setTheme] = useState('dark');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [durFilter, setDurFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [gridSize, setGridSize] = useState('medium');
  const [showTop10, setShowTop10] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);

  // User data (localStorage)
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [notes, setNotes] = useState({});
  const [tags, setTags] = useState({});
  const [allTags, setAllTags] = useState([]);
  const [watched, setWatched] = useState([]);

  // Compare
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelected, setCompareSelected] = useState([]);

  // Modals
  const [modal, setModal] = useState(null); // 'favs'|'playlists'|'analytics'|'compare'|'qr'|'backup'|'tags'|'note'|'m3u'|'pl-view'
  const [modalData, setModalData] = useState(null);

  // Open playlist selector per card
  const [plSelectorId, setPlSelectorId] = useState(null);
  const [moreMenuId, setMoreMenuId] = useState(null);

  // Thumbnail preview
  const [thumbPreview, setThumbPreview] = useState({ show: false, src: '', x: 0, y: 0 });

  // Charts refs
  const chartRefs = useRef({});
  const chartInstances = useRef({});

  const t = T[lang];

  // Load from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setFavorites(JSON.parse(localStorage.getItem('yt_favs') || '[]'));
    setPlaylists(JSON.parse(localStorage.getItem('yt_pls') || '[]'));
    setNotes(JSON.parse(localStorage.getItem('yt_notes') || '{}'));
    setTags(JSON.parse(localStorage.getItem('yt_tags') || '{}'));
    setAllTags(JSON.parse(localStorage.getItem('yt_alltags') || '[]'));
    setWatched(JSON.parse(localStorage.getItem('yt_watched') || '[]'));
    setLang(localStorage.getItem('yt_lang') || 'tr');
    setTheme(localStorage.getItem('yt_theme') || 'dark');
    setGridSize(localStorage.getItem('yt_grid') || 'medium');
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.className = theme === 'light' ? 'light' : '';
    }
  }, [theme]);

  // Persist helpers
  const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e){} };

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/videos?t=' + Date.now());
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setLastFetch(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(() => fetchData(true), 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [fetchData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
      if (modal) { if (e.key === 'Escape') setModal(null); return; }
      if (e.key === 'j' || e.key === 'J') { /* scroll next */ }
      if (e.key === 'k' || e.key === 'K') { /* scroll prev */ }
      if (e.key === '?') setModal('help');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modal]);

  // Close menus on outside click
  useEffect(() => {
    const handler = () => { setPlSelectorId(null); setMoreMenuId(null); setExportOpen(false); };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  // ── COMPUTED ──────────────────────────────────────────────────────────────
  const videos = data?.videos || [];

  const yearStats = (() => {
    const map = {};
    videos.forEach(v => {
      const y = new Date(v.publishedAt).getFullYear().toString();
      if (!map[y]) map[y] = { count: 0, views: 0, live: 0 };
      map[y].count++;
      map[y].views += v.views;
      if (v.isLive) map[y].live++;
    });
    return Object.entries(map).sort((a,b) => b[0]-a[0]);
  })();

  const top10 = [...videos].sort((a,b) => b.views - a.views).slice(0, 10);

  const filtered = videos.filter(v => {
    if (typeFilter === 'live' && !v.isLive) return false;
    if (typeFilter === 'video' && (v.isLive || v.isUpcoming)) return false;
    if (search && !v.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (durFilter === 'short' && durSec(v.duration) >= 240) return false;
    if (durFilter === 'medium' && (durSec(v.duration) < 240 || durSec(v.duration) > 1200)) return false;
    if (durFilter === 'long' && durSec(v.duration) <= 1200) return false;
    if (yearFilter && new Date(v.publishedAt).getFullYear().toString() !== yearFilter) return false;
    if (dateFrom && new Date(v.publishedAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(v.publishedAt) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  }).sort((a, b) => {
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
    if (sort === 'newest') return new Date(b.publishedAt) - new Date(a.publishedAt);
    if (sort === 'oldest') return new Date(a.publishedAt) - new Date(b.publishedAt);
    if (sort === 'mostViewed') return b.views - a.views;
    if (sort === 'mostLiked') return b.likes - a.likes;
    if (sort === 'longest') return durSec(b.duration) - durSec(a.duration);
    return 0;
  });

  // ── ACTIONS ───────────────────────────────────────────────────────────────
  const toggleFav = (id, e) => {
    e?.stopPropagation();
    const next = favorites.includes(id) ? favorites.filter(x=>x!==id) : [...favorites, id];
    setFavorites(next); save('yt_favs', next);
  };

  const toggleWatched = (id, e) => {
    e?.stopPropagation();
    const next = watched.includes(id) ? watched.filter(x=>x!==id) : [...watched, id];
    setWatched(next); save('yt_watched', next);
  };

  const createPl = () => {
    const name = prompt(t.plName);
    if (!name?.trim()) return;
    const next = [...playlists, { id: Date.now().toString(), name: name.trim(), videos: [] }];
    setPlaylists(next); save('yt_pls', next);
  };

  const addToPlaylist = (plId, vidId, e) => {
    e?.stopPropagation();
    const next = playlists.map(p => {
      if (p.id !== plId) return p;
      const vids = p.videos.includes(vidId) ? p.videos.filter(x=>x!==vidId) : [...p.videos, vidId];
      return { ...p, videos: vids };
    });
    setPlaylists(next); save('yt_pls', next);
    setPlSelectorId(null);
  };

  const deletePl = (plId) => {
    if (!confirm('Bu playlist silinsin mi?')) return;
    const next = playlists.filter(p => p.id !== plId);
    setPlaylists(next); save('yt_pls', next);
  };

  const addTag = (name) => {
    if (!name?.trim() || allTags.includes(name.trim())) return;
    const next = [...allTags, name.trim()];
    setAllTags(next); save('yt_alltags', next);
  };

  const removeTag = (name) => {
    const next = allTags.filter(t => t !== name);
    setAllTags(next); save('yt_alltags', next);
    const nextTags = {};
    Object.entries(tags).forEach(([vid, vtags]) => {
      const filtered = vtags.filter(t => t !== name);
      if (filtered.length) nextTags[vid] = filtered;
    });
    setTags(nextTags); save('yt_tags', nextTags);
  };

  const toggleVideoTag = (vidId, tag, e) => {
    e?.stopPropagation();
    const cur = tags[vidId] || [];
    const next = { ...tags, [vidId]: cur.includes(tag) ? cur.filter(t=>t!==tag) : [...cur, tag] };
    setTags(next); save('yt_tags', next);
  };

  const saveNote = (vidId, text) => {
    const next = { ...notes, [vidId]: text };
    setNotes(next); save('yt_notes', next);
  };

  const openQR = (url, e) => {
    e?.stopPropagation();
    setModalData({ url });
    setModal('qr');
    setTimeout(() => {
      const el = document.getElementById('qr-canvas');
      if (!el) return;
      el.innerHTML = '';
      if (typeof QRCode !== 'undefined') {
        new QRCode(el, { text: url, width: 200, height: 200, colorDark: '#000', colorLight: '#fff' });
      }
    }, 200);
  };

  const handleCompareSelect = (id) => {
    if (compareSelected.includes(id)) {
      setCompareSelected(compareSelected.filter(x => x !== id));
      return;
    }
    if (compareSelected.length >= 2) return;
    const next = [...compareSelected, id];
    setCompareSelected(next);
    if (next.length === 2) { setModal('compare'); setModalData({ ids: next }); }
  };

  // ── ANALYTICS CHARTS ──────────────────────────────────────────────────────
  const renderCharts = useCallback(() => {
    if (typeof Chart === 'undefined' || !videos.length) return;

    const destroy = (key) => { if (chartInstances.current[key]) { chartInstances.current[key].destroy(); } };
    const defaults = { color: '#94a3b8', borderColor: 'rgba(255,255,255,0.06)' };

    // Monthly
    const monthMap = {};
    videos.forEach(v => {
      const k = new Date(v.publishedAt).toLocaleString('tr-TR', { year:'numeric', month:'short' });
      monthMap[k] = (monthMap[k] || 0) + 1;
    });
    const monthKeys = Object.keys(monthMap).slice(-12);
    if (chartRefs.current.monthly) {
      destroy('monthly');
      chartInstances.current.monthly = new Chart(chartRefs.current.monthly, {
        type: 'bar',
        data: { labels: monthKeys, datasets: [{ data: monthKeys.map(k=>monthMap[k]), backgroundColor: 'rgba(99,102,241,.7)', borderRadius: 5 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{ticks:{color:'#64748b',maxRotation:45},grid:{color:'rgba(255,255,255,.05)'}},y:{ticks:{color:'#64748b'},grid:{color:'rgba(255,255,255,.05)'}}} }
      });
    }

    // Yearly
    const yearMap = {};
    videos.forEach(v => {
      const y = new Date(v.publishedAt).getFullYear();
      yearMap[y] = (yearMap[y] || 0) + 1;
    });
    const yrKeys = Object.keys(yearMap).sort();
    if (chartRefs.current.yearly) {
      destroy('yearly');
      chartInstances.current.yearly = new Chart(chartRefs.current.yearly, {
        type: 'line',
        data: { labels: yrKeys, datasets: [{ data: yrKeys.map(k=>yearMap[k]), borderColor:'#8b5cf6', backgroundColor:'rgba(139,92,246,.1)', tension:.4, fill:true, pointBackgroundColor:'#8b5cf6', pointRadius:5 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{ticks:{color:'#64748b'},grid:{color:'rgba(255,255,255,.05)'}},y:{ticks:{color:'#64748b'},grid:{color:'rgba(255,255,255,.05)'}}} }
      });
    }

    // Hours
    const hourMap = Array(24).fill(0);
    videos.forEach(v => { hourMap[new Date(v.publishedAt).getHours()]++; });
    if (chartRefs.current.hours) {
      destroy('hours');
      chartInstances.current.hours = new Chart(chartRefs.current.hours, {
        type: 'bar',
        data: { labels: hourMap.map((_,i)=>`${i}:00`), datasets: [{ data: hourMap, backgroundColor: 'rgba(6,182,212,.6)', borderRadius: 3 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{ticks:{color:'#64748b',maxRotation:45},grid:{display:false}},y:{ticks:{color:'#64748b'},grid:{color:'rgba(255,255,255,.05)'}}} }
      });
    }

    // Duration distribution
    const durs = { 'Kısa\n<4dk':0, 'Orta\n4-20dk':0, 'Uzun\n>20dk':0 };
    videos.forEach(v => {
      const s = durSec(v.duration);
      if (s < 240) durs['Kısa\n<4dk']++;
      else if (s <= 1200) durs['Orta\n4-20dk']++;
      else durs['Uzun\n>20dk']++;
    });
    if (chartRefs.current.duration) {
      destroy('duration');
      chartInstances.current.duration = new Chart(chartRefs.current.duration, {
        type: 'doughnut',
        data: { labels: Object.keys(durs), datasets: [{ data: Object.values(durs), backgroundColor:['rgba(16,185,129,.7)','rgba(245,158,11,.7)','rgba(239,68,68,.7)'], borderWidth:0 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'right',labels:{color:'#94a3b8',font:{size:11}}}} }
      });
    }
  }, [videos]);

  useEffect(() => {
    if (modal === 'analytics') {
      setTimeout(renderCharts, 200);
    }
  }, [modal, renderCharts]);

  // ── EXPORT ────────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const header = 'ID,Başlık,Yayın Tarihi,Görüntülenme,Beğeni,Yorum,Süre,Tür,Link';
    const rows = filtered.map(v =>
      `"${v.id}","${v.title.replace(/"/g,'""')}","${v.publishedAt}",${v.views},${v.likes},${v.comments},"${fmtDur(v.duration)}","${v.isLive?'Canlı':'Video'}","https://youtube.com/watch?v=${v.id}"`
    );
    downloadFile([header,...rows].join('\n'), `maysego_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
  };

  const exportM3U = (format) => {
    const getUrl = (id) => {
      if (format==='kodi') return `plugin://plugin.video.youtube/?action=play_video&videoid=${id}`;
      if (format==='short') return `https://youtu.be/${id}`;
      if (format==='ytdl') return `ytdl://https://www.youtube.com/watch?v=${id}`;
      return `https://www.youtube.com/watch?v=${id}`;
    };
    const lines = ['#EXTM3U'];
    filtered.forEach(v => {
      const sec = durSec(v.duration);
      const title = v.title.replace(/,/g,' ');
      lines.push(`#EXTINF:${sec} tvg-id="${v.id}" tvg-logo="${v.thumbnail}",${title}`);
      lines.push(getUrl(v.id));
    });
    downloadFile(lines.join('\n')+'\n', `maysego_${format}_${new Date().toISOString().split('T')[0]}.m3u`, 'audio/x-mpegurl');
    setModal(null);
  };

  const downloadBackup = () => {
    const payload = { version:2, exportedAt:new Date().toISOString(), favorites, playlists, notes, tags, allTags, watched };
    downloadFile(JSON.stringify(payload,null,2), `maysego_backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const restoreBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.favorites) { setFavorites(data.favorites); save('yt_favs',data.favorites); }
        if (data.playlists) { setPlaylists(data.playlists); save('yt_pls',data.playlists); }
        if (data.notes) { setNotes(data.notes); save('yt_notes',data.notes); }
        if (data.tags) { setTags(data.tags); save('yt_tags',data.tags); }
        if (data.allTags) { setAllTags(data.allTags); save('yt_alltags',data.allTags); }
        if (data.watched) { setWatched(data.watched); save('yt_watched',data.watched); }
        alert('Yedek başarıyla geri yüklendi!');
      } catch { alert('Geçersiz yedek dosyası!'); }
    };
    reader.readAsText(file);
  };

  const exportFavs = () => {
    const favVids = videos.filter(v => favorites.includes(v.id));
    downloadFile(JSON.stringify({exportedAt:new Date().toISOString(), count:favVids.length, videos:favVids},null,2),
      `maysego_favs_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  // ── RENDER HELPERS ────────────────────────────────────────────────────────
  const VideoCard = ({ v }) => {
    const isFav = favorites.includes(v.id);
    const isWatched = watched.includes(v.id);
    const isSelected = compareSelected.includes(v.id);
    const vtags = tags[v.id] || [];
    const hasNote = !!notes[v.id];

    return (
      <div
        className={`vcard ${v.isLive?'live-card':''} ${isSelected?'selected-card':''} ${isWatched?'watched-card':''}`}
        onClick={() => {
          if (compareMode) { handleCompareSelect(v.id); return; }
          window.open(`https://youtube.com/watch?v=${v.id}`, '_blank');
        }}
        onMouseEnter={(e) => {
          if (gridSize !== 'small') return;
          const rect = e.currentTarget.getBoundingClientRect();
          setThumbPreview({ show:true, src:v.thumbnail, x:rect.right+10, y:rect.top });
        }}
        onMouseLeave={() => setThumbPreview(p => ({...p, show:false}))}
      >
        <div className="vthumb">
          <img src={v.thumbnail} alt={v.title} loading="lazy" />
          {v.isLive && <span className="vlive-tag"><span className="vlive-dot"/>{t.liveNow}</span>}
          {v.isUpcoming && !v.isLive && <span className="vlive-tag" style={{background:'var(--yellow)'}}>{t.upcoming}</span>}
          {isWatched && !v.isLive && <span className="vwatched-tag">✓ {t.watched}</span>}
          {hasNote && <span className="vnote-dot"/>}
          {!v.isLive && <span className="vdur">{fmtDur(v.duration)}</span>}
          {vtags.length > 0 && (
            <div className="vtag-badges">{vtags.slice(0,3).map(tg=><span key={tg} className="vtag-badge">{tg}</span>)}</div>
          )}
        </div>
        <div className="vbody">
          <div className="vtitle">{v.title}</div>
          <div className="vmeta">
            <span>👁 {fmtNum(v.views)}</span>
            <span>👍 {fmtNum(v.likes)}</span>
            {v.liveViewers && <span className="vlive-viewers">🔴 {fmtNum(v.liveViewers)}</span>}
          </div>
          <div className="vdate">{v.isLive ? '🔴 Şu an canlı' : timeAgo(v.publishedAt, lang)}</div>
        </div>
        <div className="vactions" onClick={e=>e.stopPropagation()}>
          <button className={`vact-btn ${isFav?'fav-active':''}`} onClick={e=>toggleFav(v.id,e)}>
            {isFav ? '💖' : '🤍'}
          </button>
          <button className={`vact-btn ${isWatched?'watch-active':''}`} onClick={e=>toggleWatched(v.id,e)}>
            {isWatched ? '✓' : '○'}
          </button>
          <button className="vact-btn" onClick={e=>{e.stopPropagation();setPlSelectorId(plSelectorId===v.id?null:v.id);}}>📋</button>
          <button className="vact-btn" onClick={e=>{e.stopPropagation();setModalData({vid:v});setModal('note');}}>📝</button>
          <button className="vact-btn" onClick={e=>openQR(`https://youtube.com/watch?v=${v.id}`,e)}>📱</button>
          <button className="vact-btn" onClick={e=>{e.stopPropagation();setMoreMenuId(moreMenuId===v.id?null:v.id);}}>⋯</button>

          {/* Playlist selector */}
          {plSelectorId === v.id && (
            <div className="pl-selector open" onClick={e=>e.stopPropagation()}>
              {playlists.length === 0 && (
                <div className="pl-opt" style={{color:'var(--text3)'}}>Önce playlist oluşturun</div>
              )}
              {playlists.map(p => (
                <div key={p.id} className="pl-opt" onClick={e=>addToPlaylist(p.id,v.id,e)}>
                  {p.videos.includes(v.id)?'✓ ':''}{p.name}
                </div>
              ))}
              <div className="pl-opt" style={{borderTop:'1px solid var(--border)'}} onClick={e=>{e.stopPropagation();createPl();}}>➕ Yeni</div>
            </div>
          )}

          {/* More menu */}
          {moreMenuId === v.id && (
            <div className="more-menu open" onClick={e=>e.stopPropagation()}>
              <div className="more-item" onClick={e=>{e.stopPropagation();setModalData({vid:v,tagMode:true});setModal('note');setMoreMenuId(null);}}>🏷️ {t.tags}</div>
              <div className="more-item" onClick={e=>{e.stopPropagation();setCompareMode(true);handleCompareSelect(v.id);setMoreMenuId(null);}}>⚖️ {t.compare}</div>
              <div className="more-item" onClick={e=>{navigator.clipboard?.writeText(`https://youtube.com/watch?v=${v.id}`);setMoreMenuId(null);}}>🔗 Link Kopyala</div>
              <div className="more-item" onClick={e=>{e.stopPropagation();openQR(`https://youtube.com/watch?v=${v.id}`,e);setMoreMenuId(null);}}>📱 QR</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ModalVideos = ({ ids }) => {
    const vids = videos.filter(v => ids.includes(v.id));
    if (!vids.length) return <div className="center"><div className="empty-icon">🎬</div><p style={{color:'var(--text3)'}}>Henüz video yok</p></div>;
    return (
      <div className="modal-vid-grid">
        {vids.map(v => (
          <div key={v.id} className="modal-vcard" onClick={()=>window.open(`https://youtube.com/watch?v=${v.id}`,'_blank')}>
            <img src={v.thumbnail} alt={v.title} style={{width:'100%',aspectRatio:'16/9',objectFit:'cover',display:'block'}} loading="lazy"/>
            <div style={{padding:'.6rem'}}>
              <div style={{fontSize:'.78rem',fontWeight:600,lineHeight:1.3,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{v.title}</div>
              <div style={{fontSize:'.7rem',color:'var(--text3)',marginTop:'.3rem'}}>👁 {fmtNum(v.views)}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ── TAG MODAL CONTENT ─────────────────────────────────────────────────────
  const NoteTagModal = () => {
    const v = modalData?.vid;
    const isTagMode = modalData?.tagMode;
    const [noteText, setNoteText] = useState(notes[v?.id] || '');
    const [newTag, setNewTag] = useState('');

    if (!v) return null;
    return (
      <div className="modal-body">
        {!isTagMode && (
          <>
            <p style={{fontSize:'.85rem',color:'var(--text2)',marginBottom:.6+'rem'}}>{v.title}</p>
            <textarea className="note-textarea" value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Notunuzu buraya yazın..." />
            <div className="note-actions">
              <button className="tb-btn active" onClick={()=>{saveNote(v.id,noteText);setModal(null);}}>💾 {t.noteSave}</button>
              {notes[v.id] && <button className="tb-btn danger" onClick={()=>{saveNote(v.id,'');setModal(null);}}>🗑️ {t.noteDelete}</button>}
            </div>
          </>
        )}
        {isTagMode && (
          <>
            <p style={{fontSize:'.85rem',color:'var(--text2)',marginBottom:.8+'rem'}}>{v.title}</p>
            <div className="tag-input-row">
              <input className="tag-input-field" placeholder={t.tagAdd} value={newTag} onChange={e=>setNewTag(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'){addTag(newTag);setNewTag('');}}}/>
              <button className="tb-btn active" onClick={()=>{addTag(newTag);setNewTag('');}}>+ {t.tagAddBtn}</button>
            </div>
            <p style={{fontSize:'.78rem',color:'var(--text3)',marginBottom:'.5rem'}}>Videoya eklemek için tıklayın:</p>
            <div className="tag-selector-wrap">
              {allTags.map(tg => (
                <span key={tg} className={`tag-sel-chip ${(tags[v.id]||[]).includes(tg)?'on':''}`}
                  onClick={e=>toggleVideoTag(v.id,tg,e)}>{tg}</span>
              ))}
              {!allTags.length && <span style={{color:'var(--text3)',fontSize:'.8rem'}}>Önce etiket oluşturun</span>}
            </div>
          </>
        )}
      </div>
    );
  };

  // ── COMPARE MODAL ─────────────────────────────────────────────────────────
  const CompareModal = () => {
    const ids = modalData?.ids || compareSelected;
    const [a, b] = ids.map(id => videos.find(v => v.id === id)).filter(Boolean);
    if (!a || !b) return <div className="modal-body"><div className="center"><p>2 video seçin</p></div></div>;
    const fields = [
      { lbl: t.views, aVal: a.views, bVal: b.views, fmt: fmtNum },
      { lbl: t.likes, aVal: a.likes, bVal: b.likes, fmt: fmtNum },
      { lbl: t.comments, aVal: a.comments, bVal: b.comments, fmt: fmtNum },
      { lbl: t.duration, aVal: durSec(a.duration), bVal: durSec(b.duration), fmt: (_,iso)=>fmtDur(iso), aIso:a.duration, bIso:b.duration },
      { lbl: 'Yayın', aVal: new Date(a.publishedAt).getTime(), bVal: new Date(b.publishedAt).getTime(), fmt: (_,iso)=>fmtDate(iso,lang), aIso:a.publishedAt, bIso:b.publishedAt, higherIsBetter: false },
    ];
    return (
      <div className="modal-body">
        <div className="compare-grid">
          {[a,b].map((v,i) => (
            <div key={v.id} className="compare-col">
              <img className="compare-thumb" src={v.thumbnail} alt={v.title} />
              <div className="compare-info">
                <div className="compare-title">{v.title}</div>
                {fields.map(f => {
                  const aW = i===0 ? (f.higherIsBetter===false ? f.aVal<=f.bVal : f.aVal>=f.bVal) : (f.higherIsBetter===false ? f.bVal<=f.aVal : f.bVal>=f.aVal);
                  const val = i===0 ? (f.aIso?f.fmt(f.aVal,f.aIso):f.fmt(f.aVal)) : (f.bIso?f.fmt(f.bVal,f.bIso):f.fmt(f.bVal));
                  return (
                    <div key={f.lbl} className="compare-row">
                      <span className="lbl">{f.lbl}</span>
                      <span className={`val ${aW?'compare-winner':'compare-loser'}`}>{val} {aW&&'🏆'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── QR MODAL ──────────────────────────────────────────────────────────────
  const QRModal = () => {
    const url = modalData?.url || '';
    const [copied, setCopied] = useState(false);
    const copy = () => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(()=>setCopied(false),2000); };
    return (
      <div className="modal-body">
        <div className="qr-wrap">
          <div className="qr-canvas-wrap"><div id="qr-canvas" /></div>
          <div style={{fontSize:'.78rem',color:'var(--text3)',textAlign:'center',wordBreak:'break-all',maxWidth:320}}>{url}</div>
          <div className="share-btns">
            <button className="share-btn share-tw" onClick={()=>window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`)}>🐦 Twitter</button>
            <button className="share-btn share-fb" onClick={()=>window.open(`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)}>📘 Facebook</button>
            <button className="share-btn share-wa" onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(url)}`)}>💬 WhatsApp</button>
            <button className="share-btn share-cp" onClick={copy}>{copied?'✓ '+t.copied:'📋 '+t.copy}</button>
          </div>
        </div>
      </div>
    );
  };

  // ── MAIN RENDER ───────────────────────────────────────────────────────────
  const liveNow = videos.filter(v => v.isLive);
  const totalViews = videos.reduce((s,v)=>s+v.views,0);
  const ch = data?.channel;

  return (
    <>
      <Head>
        <title>{ch?.title || 'maysego'} — Video Arşivi</title>
        <meta name="description" content={`${ch?.title || 'maysego'} YouTube kanal arşivi`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="https://www.youtube.com/favicon.ico" />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── HEADER ── */}
      <div className="hdr">
        {ch?.banner ? <img className="hdr-banner" src={ch.banner} alt="banner"/> : <div className="hdr-banner-placeholder"/>}
        <div className="hdr-overlay"/>
        <div className="hdr-content">
          {ch?.avatar && <img className="hdr-avatar" src={ch.avatar} alt={ch.title}/>}
          <div className="hdr-info">
            {loading && !ch ? (
              <div className="spinner" style={{margin:0}}/>
            ) : (
              <>
                <div className="hdr-name">{ch?.title || 'maysego'}</div>
                <div className="hdr-sub">
                  {ch && `${fmtNum(ch.subscribers)} abone • ${fmtNum(ch.videoCount)} video`}
                  {lastFetch && ` • ${t.lastUpdate}: ${timeAgo(lastFetch, lang)}`}
                </div>
              </>
            )}
          </div>
          <div className="hdr-actions">
            <button className={`hdr-btn ${lang==='tr'?'active-lang':''}`} onClick={()=>{setLang('tr');localStorage.setItem('yt_lang','tr');}}>🇹🇷 TR</button>
            <button className={`hdr-btn ${lang==='en'?'active-lang':''}`} onClick={()=>{setLang('en');localStorage.setItem('yt_lang','en');}}>🇬🇧 EN</button>
            <button className="hdr-btn" onClick={()=>{const n=theme==='dark'?'light':'dark';setTheme(n);localStorage.setItem('yt_theme',n);}}>
              {theme==='dark'?'☀️':'🌙'} {t.theme}
            </button>
            <button className="hdr-btn" onClick={()=>fetchData()}>🔄</button>
          </div>
        </div>
      </div>

      {/* ── STATS STRIP ── */}
      <div className="stats-strip">
        <div className="stat-item"><span className="stat-icon">👁</span><div><div className="stat-val">{fmtNum(totalViews)}</div><div className="stat-lbl">{t.totalViews}</div></div></div>
        <div className="stat-sep"/>
        <div className="stat-item"><span className="stat-icon">🎬</span><div><div className="stat-val">{fmtNum(ch?.subscribers)}</div><div className="stat-lbl">{t.subs}</div></div></div>
        <div className="stat-sep"/>
        <div className="stat-item"><span className="stat-icon">📹</span><div><div className="stat-val">{videos.length}</div><div className="stat-lbl">{t.videoCount}</div></div></div>
        {liveNow.length > 0 && <>
          <div className="stat-sep"/>
          <div className="stat-item"><span className="stat-icon">🔴</span><div><div className="stat-val" style={{color:'var(--pink)'}}>{liveNow.length}</div><div className="stat-lbl">Canlı</div></div></div>
        </>}
        <div className="stat-sep"/>
        <div className="stat-item"><span className="stat-icon">💖</span><div><div className="stat-val" style={{color:'var(--pink)'}}>{favorites.length}</div><div className="stat-lbl">Favori</div></div></div>
        <div className="stat-sep"/>
        <div className="stat-item"><span className="stat-icon">✓</span><div><div className="stat-val" style={{color:'var(--green)'}}>{watched.length}</div><div className="stat-lbl">İzlendi</div></div></div>
      </div>

      {/* ── YEAR STATS ── */}
      {yearStats.length > 0 && (
        <div className="year-stats">
          <span className={`year-chip ${!yearFilter?'active':''}`} onClick={()=>setYearFilter('')}>Tüm Yıllar</span>
          {yearStats.map(([y,s]) => (
            <span key={y} className={`year-chip ${yearFilter===y?'active':''}`} onClick={()=>setYearFilter(yearFilter===y?'':y)}>
              {y} <span className="year-chip-views">{s.count}v · {fmtNum(s.views)}</span>
            </span>
          ))}
        </div>
      )}

      {/* ── TOP 10 ── */}
      {showTop10 && top10.length > 0 && (
        <div className="top10-section">
          <div className="top10-title">{t.top10} <button className="tb-btn" style={{padding:'.2rem .6rem',fontSize:'.7rem',marginLeft:'.5rem'}} onClick={()=>setShowTop10(false)}>✕</button></div>
          <div className="top10-scroll">
            {top10.map((v, i) => (
              <div key={v.id} className="top10-card" onClick={()=>window.open(`https://youtube.com/watch?v=${v.id}`,'_blank')}>
                <span className="top10-rank">#{i+1}</span>
                <img className="top10-thumb" src={v.thumbnail} alt={v.title} loading="lazy"/>
                <div className="top10-info">
                  <div className="top10-title-txt">{v.title}</div>
                  <div className="top10-views">👁 {fmtNum(v.views)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TOOLBAR ── */}
      <div className="toolbar">
        <div className="toolbar-row">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input placeholder={t.search} value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <button className={`tb-btn ${typeFilter==='all'?'active':''}`} onClick={()=>setTypeFilter('all')}>{t.all}</button>
          <button className={`tb-btn ${typeFilter==='video'?'active':''}`} onClick={()=>setTypeFilter('video')}>{t.videos}</button>
          <button className={`tb-btn ${typeFilter==='live'?'active':''}`} onClick={()=>setTypeFilter('live')}>🔴 {t.live}</button>
          <select className="tb-select" value={sort} onChange={e=>setSort(e.target.value)}>
            <option value="newest">{t.newest}</option>
            <option value="oldest">{t.oldest}</option>
            <option value="mostViewed">{t.mostViewed}</option>
            <option value="mostLiked">{t.mostLiked}</option>
            <option value="longest">{t.longest}</option>
          </select>
          <select className="tb-select" value={durFilter} onChange={e=>setDurFilter(e.target.value)}>
            <option value="all">{t.durAll}</option>
            <option value="short">{t.durShort}</option>
            <option value="medium">{t.durMed}</option>
            <option value="long">{t.durLong}</option>
          </select>
          <span className="count-label">{filtered.length} {t.showing}</span>
        </div>
        <div className="toolbar-row">
          <input type="date" className="date-input" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
          <span style={{color:'var(--text3)'}}>—</span>
          <input type="date" className="date-input" value={dateTo} onChange={e=>setDateTo(e.target.value)} />
          <button className="tb-btn danger" onClick={()=>{setDateFrom('');setDateTo('');setYearFilter('');setDurFilter('all');setSearch('');setTypeFilter('all');}}>✕ {t.clearFilters}</button>
          <div style={{marginLeft:'auto',display:'flex',gap:'.5rem'}}>
            <button className={`tb-btn ${gridSize==='small'?'active':''}`} onClick={()=>{setGridSize('small');save('yt_grid','small');}}>⊞ {t.small}</button>
            <button className={`tb-btn ${gridSize==='medium'?'active':''}`} onClick={()=>{setGridSize('medium');save('yt_grid','medium');}}>▦ {t.medium}</button>
            <button className={`tb-btn ${gridSize==='large'?'active':''}`} onClick={()=>{setGridSize('large');save('yt_grid','large');}}>▢ {t.large}</button>
          </div>
        </div>
      </div>

      {/* ── COMPARE BANNER ── */}
      {compareMode && (
        <div className="compare-banner">
          <span>{t.compareMode} ({compareSelected.length}/2 seçildi)</span>
          <button className="compare-cancel" onClick={()=>{setCompareMode(false);setCompareSelected([]);}}>✕ İptal</button>
        </div>
      )}

      {/* ── MAIN GRID ── */}
      <div className="grid-wrap">
        {loading && !data ? (
          <div className="center"><div className="spinner"/><p>{t.loading}</p></div>
        ) : error ? (
          <div className="center">
            <div className="empty-icon">⚠️</div>
            <p style={{color:'var(--pink)'}}>{error}</p>
            <button className="tb-btn active" onClick={()=>fetchData()}>Tekrar Dene</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="center"><div className="empty-icon">🔍</div><p>{t.noResults}</p></div>
        ) : (
          <div className={`vid-grid ${gridSize}`}>
            {filtered.map(v => <VideoCard key={v.id} v={v} />)}
          </div>
        )}
      </div>

      {/* ── FLOAT BUTTONS ── */}
      <div className="floats">
        <button className="float-btn pink" onClick={()=>{setModal('favs');}}>💖 {t.favorites}<span className="fav-count">{favorites.length}</span></button>
        <button className="float-btn purple" onClick={()=>setModal('playlists')}>📋 {t.playlists}</button>
        <button className="float-btn" onClick={()=>setModal('tags')}>🏷️ {t.tags}</button>
        <button className="float-btn" onClick={()=>setModal('analytics')}>📊 {t.analytics}</button>
        <button className="float-btn" onClick={()=>setCompareMode(!compareMode)}>⚖️ {t.compare}</button>
        <div className="export-wrap" onClick={e=>e.stopPropagation()}>
          <button className="float-btn" onClick={()=>setExportOpen(!exportOpen)}>📥 {t.export}</button>
          <div className={`export-menu ${exportOpen?'open':''}`}>
            <div className="export-item" onClick={exportCSV}>📊 CSV</div>
            <div className="export-item" onClick={()=>{setExportOpen(false);setModal('m3u');}}>🎵 M3U Playlist</div>
            <div className="export-item" onClick={()=>window.print()}>📄 PDF / Yazdır</div>
            <div className="export-item" onClick={exportFavs}>💖 Favorileri İndir</div>
            <div className="export-item" onClick={()=>{setExportOpen(false);setModal('backup');}}>💾 Yedek Al / Geri Yükle</div>
          </div>
        </div>
      </div>

      {/* ── THUMBNAIL PREVIEW ── */}
      <div className={`thumb-preview ${thumbPreview.show?'show':''}`}
        style={{left:thumbPreview.x, top:thumbPreview.y}}>
        <img src={thumbPreview.src} alt="" style={{width:'100%',display:'block'}}/>
      </div>

      {/* ── KEYBOARD HINTS ── */}
      <div className="kb-hints">
        <span><span className="kb-key">F</span>{t.keyF}</span>
        <span><span className="kb-key">ESC</span>Kapat</span>
        <span><span className="kb-key">?</span>Yardım</span>
      </div>

      {/* ══ MODALS ══════════════════════════════════════════════════════════ */}

      {/* FAVORITES */}
      <div className={`modal-overlay ${modal==='favs'?'open':''}`} onClick={()=>setModal(null)}>
        <div className="modal-box" onClick={e=>e.stopPropagation()}>
          <div className="modal-hdr">
            <h2>{t.favTitle} ({favorites.length})</h2>
            <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
              {favorites.length>0 && <button className="tb-btn" style={{padding:'.3rem .7rem',fontSize:'.78rem'}} onClick={exportFavs}>📥 JSON</button>}
              <button className="modal-close" onClick={()=>setModal(null)}>×</button>
            </div>
          </div>
          <div className="modal-body">
            {favorites.length===0 ? <div className="center"><div className="empty-icon">💔</div><p>{t.favEmpty}</p></div>
              : <ModalVideos ids={favorites}/>}
          </div>
        </div>
      </div>

      {/* PLAYLISTS */}
      <div className={`modal-overlay ${modal==='playlists'?'open':''}`} onClick={()=>setModal(null)}>
        <div className="modal-box" onClick={e=>e.stopPropagation()}>
          <div className="modal-hdr"><h2>{t.plTitle}</h2><button className="modal-close" onClick={()=>setModal(null)}>×</button></div>
          <div className="modal-body">
            <div className="pl-controls">
              <button className="tb-btn active" onClick={createPl}>{t.plCreate}</button>
            </div>
            {playlists.length===0 ? <div className="center"><div className="empty-icon">📂</div><p>{t.plEmpty}</p></div> : (
              <div className="pl-cards-grid">
                {playlists.map(p => (
                  <div key={p.id} className="pl-card" onClick={()=>{setModalData({pl:p});setModal('pl-view');}}>
                    <div className="pl-card-name">📋 {p.name}</div>
                    <div className="pl-card-count">{p.videos.length} video</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PLAYLIST VIEW */}
      <div className={`modal-overlay ${modal==='pl-view'?'open':''}`} onClick={()=>setModal('playlists')}>
        <div className="modal-box" onClick={e=>e.stopPropagation()}>
          <div className="modal-hdr">
            <h2>📋 {modalData?.pl?.name}</h2>
            <div style={{display:'flex',gap:'.5rem'}}>
              <button className="tb-btn danger" style={{padding:'.3rem .7rem',fontSize:'.78rem'}} onClick={()=>{deletePl(modalData?.pl?.id);setModal('playlists');}}>🗑️ Sil</button>
              <button className="modal-close" onClick={()=>setModal('playlists')}>×</button>
            </div>
          </div>
          <div className="modal-body">
            <ModalVideos ids={modalData?.pl?.videos||[]}/>
          </div>
        </div>
      </div>

      {/* TAGS */}
      <div className={`modal-overlay ${modal==='tags'?'open':''}`} onClick={()=>setModal(null)}>
        <div className="modal-box sm" onClick={e=>e.stopPropagation()}>
          <div className="modal-hdr"><h2>{t.tagTitle}</h2><button className="modal-close" onClick={()=>setModal(null)}>×</button></div>
          <div className="modal-body">
            <TagManagerContent addTag={addTag} allTags={allTags} removeTag={removeTag} t={t}/>
          </div>
        </div>
      </div>

      {/* NOTE / TAG SELECTOR */}
      <div className={`modal-overlay ${modal==='note'?'open':''}`} onClick={()=>setModal(null)}>
        <div className="modal-box sm" onClick={e=>e.stopPropagation()}>
          <div className="modal-hdr"><h2>{modalData?.tagMode?t.tags:t.noteTitle}</h2><button className="modal-close" onClick={()=>setModal(null)}>×</button></div>
          {modal==='note' && <NoteTagModal/>}
        </div>
      </div>

      {/* ANALYTICS */}
      <div className={`modal-overlay ${modal==='analytics'?'open':''}`} onClick={()=>setModal(null)}>
        <div className="modal-box xl" onClick={e=>e.stopPropagation()}>
          <div className="modal-hdr"><h2>{t.analyticsTitle}</h2><button className="modal-close" onClick={()=>setModal(null)}>×</button></div>
          <div className="modal-body">
            <div className="stat-cards-grid">
              <div className="stat-card"><div className="stat-card-val">{fmtNum(totalViews)}</div><div className="stat-card-lbl">{t.totalViews}</div></div>
              <div className="stat-card"><div className="stat-card-val">{fmtNum(videos.reduce((s,v)=>s+v.likes,0))}</div><div className="stat-card-lbl">{t.likes}</div></div>
              <div className="stat-card"><div className="stat-card-val">{fmtNum(videos.reduce((s,v)=>s+v.comments,0))}</div><div className="stat-card-lbl">{t.comments}</div></div>
              <div className="stat-card"><div className="stat-card-val">{videos.length>0?fmtNum(Math.round(totalViews/videos.length)):0}</div><div className="stat-card-lbl">Ort. İzlenme</div></div>
              <div className="stat-card"><div className="stat-card-val">{videos.filter(v=>v.isLive).length}</div><div className="stat-card-lbl">Canlı Yayın</div></div>
              <div className="stat-card"><div className="stat-card-val">{yearStats.length}</div><div className="stat-card-lbl">Aktif Yıl</div></div>
            </div>
            <div className="charts-grid">
              <div className="chart-card"><h3>Aylık Video Dağılımı</h3><div className="chart-container"><canvas ref={el=>chartRefs.current.monthly=el}/></div></div>
              <div className="chart-card"><h3>Yıllık Video Sayısı</h3><div className="chart-container"><canvas ref={el=>chartRefs.current.yearly=el}/></div></div>
              <div className="chart-card"><h3>En Aktif Saatler</h3><div className="chart-container"><canvas ref={el=>chartRefs.current.hours=el}/></div></div>
              <div className="chart-card"><h3>Süre Dağılımı</h3><div className="chart-container"><canvas ref={el=>chartRefs.current.duration=el}/></div></div>
            </div>
          </div>
        </div>
      </div>

      {/* COMPARE */}
      <div className={`modal-overlay ${modal==='compare'?'open':''}`} onClick={()=>{setModal(null);setCompareMode(false);setCompareSelected([]);}}>
        <div className="modal-box xl" onClick={e=>e.stopPropagation()}>
          <div className="modal-hdr">
            <h2>{t.compareTitle}</h2>
            <button className="modal-close" onClick={()=>{setModal(null);setCompareMode(false);setCompareSelected([]);}}>×</button>
          </div>
          {modal==='compare' && <CompareModal/>}
        </div>
      </div>

      {/* QR */}
      <div className={`modal-overlay ${modal==='qr'?'open':''}`} onClick={()=>setModal(null)}>
        <div className="modal-box sm" onClick={e=>e.stopPropagation()}>
          <div className="modal-hdr"><h2>{t.qrTitle}</h2><button className="modal-close" onClick={()=>setModal(null)}>×</button></div>
          {modal==='qr' && <QRModal/>}
        </div>
      </div>

      {/* BACKUP */}
      <div className={`modal-overlay ${modal==='backup'?'open':''}`} onClick={()=>setModal(null)}>
        <div className="modal-box sm" onClick={e=>e.stopPropagation()}>
          <div className="modal-hdr"><h2>{t.backupTitle}</h2><button className="modal-close" onClick={()=>setModal(null)}>×</button></div>
          <div className="modal-body">
            <div className="backup-section">
              <div className="backup-block">
                <h3>💾 Yedek Al</h3>
                <p>Tüm favoriler, playlistler, notlar, etiketler ve izleme geçmişi</p>
                <div className="backup-btns">
                  <button className="tb-btn active" onClick={downloadBackup}>📥 Yedeği İndir</button>
                </div>
              </div>
              <div className="backup-block">
                <h3>📤 Geri Yükle</h3>
                <p>Daha önce aldığınız yedek dosyasını yükleyin</p>
                <div className="backup-btns">
                  <button className="tb-btn" onClick={()=>document.getElementById('restore-input')?.click()}>📂 Dosya Seç</button>
                  <input id="restore-input" type="file" accept=".json" style={{display:'none'}} onChange={restoreBackup}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* M3U */}
      <div className={`modal-overlay ${modal==='m3u'?'open':''}`} onClick={()=>setModal(null)}>
        <div className="modal-box sm" onClick={e=>e.stopPropagation()}>
          <div className="modal-hdr"><h2>{t.m3uModal}</h2><button className="modal-close" onClick={()=>setModal(null)}>×</button></div>
          <div className="modal-body">
            <div className="m3u-options">
              <div className="m3u-opt" onClick={()=>exportM3U('vlc')}>
                <div className="m3u-opt-name">🖥️ VLC / Standart</div>
                <div className="m3u-opt-url">https://www.youtube.com/watch?v=ID</div>
                <div className="m3u-opt-desc">VLC, MPC-HC, PotPlayer, mpv için</div>
              </div>
              <div className="m3u-opt" onClick={()=>exportM3U('kodi')}>
                <div className="m3u-opt-name">📺 Kodi</div>
                <div className="m3u-opt-url">plugin://plugin.video.youtube/?action=play_video&videoid=ID</div>
                <div className="m3u-opt-desc">Kodi + YouTube eklentisi gerekli</div>
              </div>
              <div className="m3u-opt" onClick={()=>exportM3U('short')}>
                <div className="m3u-opt-name">🔗 Kısa Link</div>
                <div className="m3u-opt-url">https://youtu.be/ID</div>
                <div className="m3u-opt-desc">Mobil uygulamalar ve paylaşım için</div>
              </div>
              <div className="m3u-opt" onClick={()=>exportM3U('ytdl')}>
                <div className="m3u-opt-name">⚙️ youtube-dl / yt-dlp</div>
                <div className="m3u-opt-url">ytdl://https://www.youtube.com/watch?v=ID</div>
                <div className="m3u-opt-desc">yt-dlp entegreli playerlar için</div>
              </div>
              <p style={{fontSize:'.75rem',color:'var(--text3)',textAlign:'center',marginTop:'.5rem'}}>
                💡 {filtered.length} video export edilecek (aktif filtreler uygulandı)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* HELP */}
      <div className={`modal-overlay ${modal==='help'?'open':''}`} onClick={()=>setModal(null)}>
        <div className="modal-box sm" onClick={e=>e.stopPropagation()}>
          <div className="modal-hdr"><h2>⌨️ Klavye Kısayolları</h2><button className="modal-close" onClick={()=>setModal(null)}>×</button></div>
          <div className="modal-body">
            {[['F','Favoriye ekle/çıkar'],['ESC','Modalı kapat'],['?','Bu yardımı göster']].map(([k,d])=>(
              <div key={k} style={{display:'flex',alignItems:'center',gap:'1rem',padding:'.6rem 0',borderBottom:'1px solid var(--border)'}}>
                <span className="kb-key" style={{background:'var(--card2)',border:'1px solid var(--border)',borderRadius:5,padding:'2px 10px',fontWeight:700}}>{k}</span>
                <span style={{color:'var(--text2)',fontSize:'.85rem'}}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// Ayrı component — hook kuralları için
function TagManagerContent({ addTag, allTags, removeTag, t }) {
  const [newTag, setNewTag] = useState('');
  return (
    <>
      <div className="tag-input-row">
        <input className="tag-input-field" placeholder={t.tagAdd} value={newTag} onChange={e=>setNewTag(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter'){addTag(newTag);setNewTag('');}}}/>
        <button className="tb-btn active" onClick={()=>{addTag(newTag);setNewTag('');}}>+ {t.tagAddBtn}</button>
      </div>
      <div className="tag-list-wrap">
        {allTags.length===0 && <span style={{color:'var(--text3)',fontSize:'.82rem'}}>Henüz etiket yok. Yukarıdan ekleyin.</span>}
        {allTags.map(tg => (
          <span key={tg} className="tag-chip">
            🏷️ {tg}
            <span className="tag-chip-del" onClick={()=>removeTag(tg)}>×</span>
          </span>
        ))}
      </div>
    </>
  );
}
