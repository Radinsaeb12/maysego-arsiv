# maysego Video Arşivi v2

Canlı YouTube verisi çeken, tam özellikli video arşivi.

## Özellikler
- 🔴 Canlı yayın takibi (her 5dk otomatik yenileme)
- 🏆 En çok izlenen Top 10
- 📊 Grafik istatistikleri (aylık, yıllık, saat, süre dağılımı)
- 💖 Favoriler, 📋 Playlistler, 🏷️ Etiketler, 📝 Notlar
- ✓ İzlenme takibi
- ⚖️ Video karşılaştırma
- 📱 QR kod + sosyal paylaşım
- 📥 CSV, M3U (4 format), PDF, JSON yedek
- 🌙 Dark / Light tema, 🇹🇷 TR / 🇬🇧 EN dil desteği
- Gelişmiş filtreler (yıl, tarih aralığı, süre, tür)
- Grid boyutu (küçük/orta/büyük)

---

## Vercel Deploy

### 1. GitHub'a yükle
- github.com → New Repository → `maysego-arsiv`
- Bu klasördeki dosyaları yükle (.env.local OLMADAN)

### 2. Vercel bağla
- vercel.com → Add New Project → repoyu seç → Import

### 3. Environment Variable ekle ⚠️
- Name: `YOUTUBE_API_KEY`
- Value: `AIzaSyCcVV2EBRLc8f8Ccx7gA7Kqmeg8Y5DltPk`

### 4. Deploy!

---

## Lokal test
```bash
npm install
npm run dev
# → http://localhost:3000
```
