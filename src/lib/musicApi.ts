// 简化的音乐 API：全部基于 Meting API（不再依赖本地代理服务）
// 保留旧导出函数名以减少 UI 改动；其行为改为直接调用 Meting API

import type {
	CloudPlaylistSummary,
	MusicProvider,
	SavedPlaylist,
} from "../types";
import {
	fetchMetingPlaylist,
	fetchMetingSongUrl,
	loadMetingLyrics,
	type MetingSong,
	searchMetingSongs,
} from "./metingApi";
import { metingConfig } from "./metingConfig";

export type { MetingSong } from "./metingApi";
export type { MetingServer, MetingType } from "./metingConfig";

export interface ApiResponse<T> {
	ok: boolean;
	status: number;
	data: T;
}

export interface SongListPayload {
	songs?: MetingSong[];
	playlists?: CloudPlaylistSummary[];
	status?: string;
	fallback?: boolean;
	rawCount?: number;
	loadedCount?: number;
	totalCount?: number;
	error?: string;
}

// 旧：本地服务器歌单存储；现：仅 localStorage
export function loadServerPlaylists(): Promise<
	ApiResponse<{ playlists?: SavedPlaylist[] }>
> {
	return Promise.resolve({ ok: true, status: 200, data: { playlists: [] } });
}

export function saveServerPlaylists(
	_playlists: SavedPlaylist[],
): Promise<ApiResponse<{ playlists?: SavedPlaylist[] }>> {
	return Promise.resolve({ ok: true, status: 200, data: { playlists: [] } });
}

// 加载默认 Meting 播放列表
export async function loadDefaultPlaylist(): Promise<MetingSong[]> {
	return fetchMetingPlaylist(
		metingConfig.meting.server,
		metingConfig.meting.type,
		metingConfig.meting.id,
	);
}

// 搜索（兼容旧接口 searchCloudMusic）
export async function searchCloudMusic(
	_provider: MusicProvider,
	keywords: string,
	_cookie: string,
): Promise<ApiResponse<SongListPayload>> {
	try {
		const songs = await searchMetingSongs(
			keywords,
			metingConfig.searchServer,
			30,
		);
		return { ok: true, status: 200, data: { songs, rawCount: songs.length } };
	} catch (error) {
		return { ok: false, status: 500, data: { error: String(error) } };
	}
}

// 旧：加载云歌单内容；现：通过 Meting 加载指定歌单 ID
export async function loadCloudPayload<T = SongListPayload>(
	_url: string,
	_provider: MusicProvider,
	_cookie: string,
): Promise<ApiResponse<T>> {
	try {
		const songs = await fetchMetingPlaylist();
		return { ok: true, status: 200, data: { songs } as unknown as T };
	} catch (error) {
		return {
			ok: false,
			status: 500,
			data: { error: String(error) } as unknown as T,
		};
	}
}

// 旧：根据 URL 加载歌曲；现：通过 Meting 获取单曲 URL 列表
export async function loadSongPlaybackResources(
	song: MetingSong,
): Promise<{ urls: string[]; lyric: string }> {
	const [urls, lyric] = await Promise.all([
		fetchMetingSongUrl(song),
		loadMetingLyrics(song),
	]);
	return { urls, lyric };
}

// 旧：加载歌词；现：通过 Meting 获取歌词文本
export async function loadSongLyrics(
	song: MetingSong,
): Promise<{ lyric: string }> {
	const lyric = await loadMetingLyrics(song);
	return { lyric };
}

// 兼容旧导出
export function buildMusicSearchUrl(
	_provider: MusicProvider,
	keywords: string,
	_hasCookie: boolean,
) {
	return `/search?q=${encodeURIComponent(keywords)}`;
}

export async function logoutQQProxy(): Promise<void> {
	// no-op
}

export function syncNeteaseProxyCookie(
	_cookie: string,
): Promise<ApiResponse<{ valid?: boolean }>> {
	return Promise.resolve({ ok: true, status: 200, data: { valid: false } });
}

export function syncQQProxyCookie(
	_cookie: string,
): Promise<ApiResponse<{ loggedIn?: boolean }>> {
	return Promise.resolve({ ok: true, status: 200, data: { loggedIn: false } });
}

export function providerCookieHeaders(
	_provider: MusicProvider,
	_cookie: string,
) {
	return {};
}
