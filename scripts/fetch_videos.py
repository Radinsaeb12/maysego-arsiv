import requests
import json
from datetime import datetime

API_KEY = "AIzaSyCcVV2EBRLc8f8Ccx7gA7Kqmeg8Y5DltPk"
CHANNEL_ID = "UCoMmsltlxloR8hwDPXCvl0w"

def get_all_videos():
    url = "https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&id=" + CHANNEL_ID + "&key=" + API_KEY
    res = requests.get(url).json()
    channel = res["items"][0]
    uploads_id = channel["contentDetails"]["relatedPlaylists"]["uploads"]
    channel_info = {
        "title": channel["snippet"]["title"],
        "thumbnail": channel["snippet"]["thumbnails"]["default"]["url"]
    }

    video_ids = []
    next_page = None
    while True:
        url = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=" + uploads_id + "&maxResults=50&key=" + API_KEY
        if next_page:
            url += "&pageToken=" + next_page
        res = requests.get(url).json()
        for item in res.get("items", []):
            video_ids.append(item["snippet"]["resourceId"]["videoId"])
        next_page = res.get("nextPageToken")
        if not next_page:
            break

    print(str(len(video_ids)) + " video bulundu, detaylar cekiliyor...")

    videos = []
    for i in range(0, len(video_ids), 50):
        batch = ",".join(video_ids[i:i+50])
        url = "https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,liveStreamingDetails&id=" + batch + "&key=" + API_KEY
        res = requests.get(url).json()
        for v in res.get("items", []):
            thumbs = v["snippet"]["thumbnails"]
            thumb = thumbs.get("maxres", thumbs.get("high", thumbs.get("default", {}))).get("url", "")
            videos.append({
                "id": v["id"],
                "title": v["snippet"]["title"],
                "description": v["snippet"].get("description", "")[:300],
                "thumbnail": thumb,
                "publishedAt": v["snippet"]["publishedAt"],
                "views": v["statistics"].get("viewCount", 0),
                "likes": v["statistics"].get("likeCount", 0),
                "comments": v["statistics"].get("commentCount", 0),
                "duration": v["contentDetails"]["duration"],
                "isLive": "liveStreamingDetails" in v
            })

    return channel_info, videos

channel_info, videos = get_all_videos()

years_stats = {}
for v in videos:
    year = v["publishedAt"][:4]
    if year not in years_stats:
        years_stats[year] = {"total": 0, "views": 0, "live": 0}
    years_stats[year]["total"] += 1
    years_stats[year]["views"] += int(v["views"])
    if v["isLive"]:
        years_stats[year]["live"] += 1

output = {
    "lastUpdated": datetime.utcnow().isoformat(),
    "channel": channel_info,
    "years_stats": years_stats,
    "videos": videos
}

with open("videos.json", "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print("Tamamlandi! " + str(len(videos)) + " video videos.json'a yazildi.")
