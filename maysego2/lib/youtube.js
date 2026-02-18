const KEY = process.env.YOUTUBE_API_KEY;
const BASE = 'https://www.googleapis.com/youtube/v3';

async function yt(path, params) {
  const url = `${BASE}${path}?${new URLSearchParams({ key: KEY, ...params })}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

export async function resolveChannelId(handle) {
  // Try search first
  const data = await yt('/search', { part: 'snippet', type: 'channel', q: handle, maxResults: 1 });
  if (data.items?.[0]) return data.items[0].snippet.channelId;
  throw new Error('Kanal bulunamadı');
}

export async function getChannelInfo(channelId) {
  const data = await yt('/channels', {
    part: 'snippet,statistics,brandingSettings,contentDetails',
    id: channelId,
  });
  const ch = data.items?.[0];
  if (!ch) throw new Error('Kanal bilgisi alınamadı');
  return ch;
}

export async function getAllVideos(uploadsPlaylistId) {
  let videos = [], pageToken = '';
  for (let page = 0; page < 10; page++) {
    const params = { part: 'snippet,contentDetails', playlistId: uploadsPlaylistId, maxResults: 50 };
    if (pageToken) params.pageToken = pageToken;
    const data = await yt('/playlistItems', params);
    if (!data.items?.length) break;
    videos = videos.concat(data.items);
    pageToken = data.nextPageToken || '';
    if (!pageToken) break;
  }
  return videos;
}

export async function getVideoDetails(ids) {
  const chunks = [];
  for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50));
  let all = [];
  for (const chunk of chunks) {
    const data = await yt('/videos', {
      part: 'snippet,statistics,contentDetails,liveStreamingDetails',
      id: chunk.join(','),
    });
    if (data.items) all = all.concat(data.items);
  }
  return all;
}

export async function getLive(channelId) {
  const data = await yt('/search', {
    part: 'snippet',
    channelId,
    eventType: 'live',
    type: 'video',
    maxResults: 10,
  });
  return data.items || [];
}
