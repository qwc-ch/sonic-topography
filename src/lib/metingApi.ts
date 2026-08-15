// Meting API 客户端 — 参考 Firefly 的 fetchMetingData 逻辑
// 提供：获取播放列表、搜索歌曲、获取单曲 URL（带备用 API 回退）

import {
	buildMetingUrl,
	getMetingPlaylistId,
	type MetingServer,
	type MetingType,
	metingConfig,
} from "./metingConfig";

export interface MetingSong {
	id: string | number;
	name: string;
	artist: string;
	album: string;
	url: string;
	cover: string;
	lrc: string;
	duration: number;
}

interface RawMetingItem {
	title?: string;
	name?: string;
	author?: string;
	artist?: string;
	url?: string;
	pic?: string;
	cover?: string;
	lrc?: string;
	link?: string;
}

function normalizeItem(item: RawMetingItem): MetingSong {
	const name = item.title || item.name || "Unknown";
	const artist = item.author || item.artist || "Unknown";
	return {
		id: `${name}::${artist}::${item.url || ""}`,
		name,
		artist,
		album: "",
		url: item.url || "",
		cover: item.pic || item.cover || "",
		lrc: item.lrc || "",
		duration: 0,
	};
}

// 依次尝试主 API + 备用 API，返回第一个成功的非空列表
export async function fetchMetingPlaylist(
	server: MetingServer = metingConfig.meting.server,
	type: MetingType = metingConfig.meting.type,
	id: string = getMetingPlaylistId(),
): Promise<MetingSong[]> {
	const m = metingConfig.meting;
	const apis = [m.api, ...(m.fallbackApis || [])];

	for (const template of apis) {
		if (!template) continue;
		try {
			const fetchUrl = buildMetingUrl(template, server, type, id);
			const res = await fetch(fetchUrl);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			if (Array.isArray(data) && data.length > 0) {
				return data.map(normalizeItem);
			}
		} catch (e) {
			console.warn("Meting API failed for", template, e);
		}
	}
	throw new Error("所有 Meting API 均不可用");
}

// 搜索歌曲：通过 Meting API 的 search 类型
export async function searchMetingSongs(
	keywords: string,
	server: MetingServer = metingConfig.searchServer,
	limit = 30,
): Promise<MetingSong[]> {
	const m = metingConfig.meting;
	const apis = [m.api, ...(m.fallbackApis || [])];

	for (const template of apis) {
		if (!template) continue;
		try {
			const fetchUrl = buildMetingUrl(
				template,
				server,
				"search",
				encodeURIComponent(keywords),
			);
			const res = await fetch(fetchUrl);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			if (Array.isArray(data)) {
				const songs = data.map(normalizeItem);
				return songs.slice(0, limit);
			}
		} catch (e) {
			console.warn("Meting search failed for", template, e);
		}
	}
	return [];
}

// 获取单曲可播放 URL（带备用回退）
export async function fetchMetingSongUrl(song: MetingSong): Promise<string[]> {
	if (!song.url) return [];
	const urls = [song.url];

	// Meting URL 通常带 ?id=...&server=...，可构造备用 API 的 url 类型请求
	const matchId = song.url.match(/[?&]id=([^&]+)/);
	const matchServer = song.url.match(/[?&]server=([^&]+)/);
	if (matchId && matchServer && metingConfig.meting.fallbackApis) {
		for (const fallback of metingConfig.meting.fallbackApis) {
			const fallbackUrl = buildMetingUrl(
				fallback,
				matchServer[1],
				"url",
				matchId[1],
			);
			if (!urls.includes(fallbackUrl)) urls.push(fallbackUrl);
		}
	}

	return urls;
}

// 加载歌词：lrc 可能是 URL，也可能是直接 LRC 文本
export async function loadMetingLyrics(song: MetingSong): Promise<string> {
	const lrc = song.lrc;
	if (!lrc) return "";

	// 判断是否为 URL
	const isUrl =
		/^(https?:)?\/\//.test(lrc) ||
		lrc.startsWith("/") ||
		/\.(lrc|txt)(\?|#|$)/i.test(lrc);
	if (isUrl) {
		try {
			const res = await fetch(lrc);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return await res.text();
		} catch (e) {
			console.warn("Meting lyrics fetch failed:", e);
			return "";
		}
	}
	return lrc;
}

// 按歌名+歌手在线匹配歌词（供本地歌曲使用）：先搜索歌曲再取 lrc 类型
export async function fetchMetingLyricsBySong(
	songName: string,
	artist: string,
): Promise<string> {
	const meta = await fetchMetingSongMeta(songName, artist);
	return meta.lrc;
}

// 按歌名+歌手在线匹配封面与歌词（供本地歌曲使用，一次搜索取两者）
export async function fetchMetingSongMeta(
	songName: string,
	artist: string,
): Promise<{ cover: string; lrc: string }> {
	const keywords =
		artist && artist !== "未知歌手" ? `${artist} - ${songName}` : songName;
	const results = await searchMetingSongs(
		keywords,
		metingConfig.searchServer,
		5,
	);
	if (results.length === 0) return { cover: "", lrc: "" };
	const candidate = results.find((item) => item.name === songName) || results[0];

	let lrc = "";
	// 搜索结果自带 lrc（可能是 URL 或文本）时直接使用
	if (candidate.lrc) {
		const direct = await loadMetingLyrics(candidate);
		if (direct.trim()) lrc = direct;
	}

	if (!lrc) {
		const matchId = candidate.url.match(/[?&]id=([^&]+)/);
		const matchServer = candidate.url.match(/[?&]server=([^&]+)/);
		if (matchId) {
			const server = (matchServer?.[1] || metingConfig.meting.server) as MetingServer;
			const apis = [metingConfig.meting.api, ...(metingConfig.meting.fallbackApis || [])];

			for (const template of apis) {
				if (!template) continue;
				try {
					const fetchUrl = buildMetingUrl(template, server, "lrc", matchId[1]);
					const res = await fetch(fetchUrl);
					if (!res.ok) throw new Error(`HTTP ${res.status}`);
					const text = await res.text();
					if (text.trim() && !text.startsWith("{")) {
						lrc = text;
						break;
					}
				} catch (e) {
					console.warn("Meting lyric failed for", template, e);
				}
			}
		}
	}

	return { cover: candidate.cover || "", lrc };
}
