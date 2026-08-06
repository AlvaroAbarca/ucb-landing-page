import { env } from "cloudflare:workers";
import type { YoutubeVideo } from "../types/youtube.types";

const CACHE_TTL_SECONDS = 86_400; // 24h
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3/playlistItems";

interface PlaylistItemsResponse {
  items?: Array<{
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
      thumbnails?: {
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
      resourceId?: {
        videoId?: string;
      };
    };
  }>;
}

function cacheKey(playlistId: string, limit: number): string {
  return `playlist:${playlistId}:latest:${limit}`;
}

function mapPlaylistItems(
  data: PlaylistItemsResponse,
  limit: number,
): YoutubeVideo[] {
  const items = data.items ?? [];
  const videos: YoutubeVideo[] = [];

  for (const item of items) {
    if (videos.length >= limit) break;

    const snippet = item.snippet;
    const videoId = snippet?.resourceId?.videoId;
    if (!snippet || !videoId) continue;

    const thumbnail =
      snippet.thumbnails?.high?.url ??
      snippet.thumbnails?.medium?.url ??
      snippet.thumbnails?.default?.url ??
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    videos.push({
      title: snippet.title ?? "Sin título",
      description: snippet.description ?? "",
      thumbnail,
      videoId,
      publishedAt: snippet.publishedAt ?? new Date().toISOString(),
    });
  }

  return videos;
}

async function fetchFromYouTube(
  playlistId: string,
  apiKey: string,
  limit: number,
): Promise<YoutubeVideo[]> {
  const url = new URL(YOUTUBE_API_BASE);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("maxResults", String(limit));
  url.searchParams.set("playlistId", playlistId);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    console.error(
      `YouTube playlistItems failed: ${response.status} ${response.statusText}`,
    );
    return [];
  }

  const data = (await response.json()) as PlaylistItemsResponse;
  return mapPlaylistItems(data, limit);
}

export async function getLatestPredicas(
  limit = 3,
): Promise<YoutubeVideo[]> {
  const playlistId = env.YOUTUBE_PLAYLIST_ID;
  const apiKey = env.YOUTUBE_API_KEY;
  const kv = env.PREDICAS_CACHE;

  if (!playlistId || !apiKey) {
    console.error("Missing YOUTUBE_PLAYLIST_ID or YOUTUBE_API_KEY");
    return [];
  }

  const key = cacheKey(playlistId, limit);

  try {
    const cached = await kv.get<YoutubeVideo[]>(key, "json");
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached.slice(0, limit);
    }
  } catch (error) {
    console.error("KV read failed for predicas cache", error);
  }

  try {
    const videos = await fetchFromYouTube(playlistId, apiKey, limit);
    if (videos.length > 0) {
      try {
        await kv.put(key, JSON.stringify(videos), {
          expirationTtl: CACHE_TTL_SECONDS,
        });
      } catch (error) {
        console.error("KV write failed for predicas cache", error);
      }
    }
    return videos;
  } catch (error) {
    console.error("Failed to fetch predicas from YouTube", error);
    return [];
  }
}
