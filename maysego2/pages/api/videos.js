import { resolveChannelId, getChannelInfo, getAllVideos, getVideoDetails, getLive } from '../../lib/youtube';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
  try {
    const channelId = await resolveChannelId('@maysego');
    const [chInfo, liveItems] = await Promise.all([
      getChannelInfo(channelId),
      getLive(channelId),
    ]);

    const uploadsId = chInfo.contentDetails.relatedPlaylists.uploads;
    const playlistItems = await getAllVideos(uploadsId);
    const videoIds = playlistItems.map(i => i.contentDetails.videoId);
    const details = await getVideoDetails(videoIds);

    const liveSet = new Set(liveItems.map(l => l.id.videoId));

    const videos = details.map(v => {
      const isLive = liveSet.has(v.id) || v.snippet.liveBroadcastContent === 'live';
      const isUpcoming = v.snippet.liveBroadcastContent === 'upcoming';
      return {
        id: v.id,
        title: v.snippet.title,
        description: v.snippet.description?.slice(0, 300) || '',
        publishedAt: v.snippet.publishedAt,
        thumbnail:
          v.snippet.thumbnails?.maxres?.url ||
          v.snippet.thumbnails?.high?.url ||
          v.snippet.thumbnails?.medium?.url || '',
        duration: v.contentDetails.duration,
        views: parseInt(v.statistics.viewCount || 0),
        likes: parseInt(v.statistics.likeCount || 0),
        comments: parseInt(v.statistics.commentCount || 0),
        isLive,
        isUpcoming,
        liveViewers: v.liveStreamingDetails?.concurrentViewers
          ? parseInt(v.liveStreamingDetails.concurrentViewers)
          : null,
      };
    });

    // Live first, then newest
    videos.sort((a, b) => {
      if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    });

    res.status(200).json({
      channel: {
        id: channelId,
        title: chInfo.snippet.title,
        description: chInfo.snippet.description || '',
        avatar: chInfo.snippet.thumbnails?.high?.url || chInfo.snippet.thumbnails?.default?.url || '',
        banner: chInfo.brandingSettings?.image?.bannerExternalUrl || '',
        subscribers: parseInt(chInfo.statistics.subscriberCount || 0),
        totalViews: parseInt(chInfo.statistics.viewCount || 0),
        videoCount: parseInt(chInfo.statistics.videoCount || 0),
      },
      videos,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
