// 本地目录音乐：读取 Vite 插件生成的 /music-index.json（扫描 public/music/），
// 把目录里的音频文件包装成 MetingSong 形状（provider: "local"）。
// 与上传的文件不同，这里的 url 是持久有效的静态资源地址，刷新后仍可播放。

import type { MetingSong } from "../types";
import { LOCAL_PROVIDER } from "./localSong";
import { extractAudioMetadata, parseFileName } from "./metadata";

const AUDIO_EXTS = [".mp3", ".wav", ".flac", ".m4a", ".aac", ".ogg", ".opus"];
const LRC_EXT = ".lrc";
const baseUrl = import.meta.env.BASE_URL || "/";

export async function fetchMusicFolderFiles(): Promise<string[]> {
	try {
		const res = await fetch(`${baseUrl}music-index.json`);
		if (!res.ok) return [];
		const data = (await res.json()) as { files?: string[] };
		return Array.isArray(data.files) ? data.files : [];
	} catch {
		return [];
	}
}

export async function loadMusicFolderSongs(): Promise<MetingSong[]> {
	const files = await fetchMusicFolderFiles();
	const audioFiles = files.filter((file) =>
		AUDIO_EXTS.some((ext) => file.toLowerCase().endsWith(ext)),
	);
	const lrcByBaseName = new Map<string, string>();
	for (const file of files) {
		if (file.toLowerCase().endsWith(LRC_EXT)) {
			lrcByBaseName.set(file.slice(0, -LRC_EXT.length).toLowerCase(), file);
		}
	}

	return audioFiles.map((file) => {
		const { title, artist } = parseFileName(file);
		const baseKey = file.replace(/\.[^.]+$/, "").toLowerCase();
		const lrcFile = lrcByBaseName.get(baseKey);
		return {
			id: `folder-${file}`,
			name: title,
			artist: artist || "未知歌手",
			album: "",
			cover: "",
			url: `${baseUrl}music/${file}`,
			lrc: lrcFile ? `${baseUrl}music/${lrcFile}` : "",
			duration: 0,
			provider: LOCAL_PROVIDER,
		};
	});
}

export interface FolderSongEnrichment {
	title?: string;
	artist?: string;
	album?: string;
	cover?: string;
	lyrics?: string;
}

const enrichmentCache = new Map<string, Promise<FolderSongEnrichment>>();

/** 提取本地音频文件的内嵌标签/封面/歌词（只取一次，结果缓存） */
export function enrichFolderSong(
	song: MetingSong,
): Promise<FolderSongEnrichment> {
	const cached = enrichmentCache.get(song.url);
	if (cached) return cached;
	const promise = (async () => {
		try {
			const res = await fetch(song.url);
			if (!res.ok) return {};
			const blob = await res.blob();
			const metadata = await extractAudioMetadata(blob, song.name);
			return {
				title: metadata.title || undefined,
				artist: metadata.artist || undefined,
				album: metadata.album || undefined,
				cover: metadata.cover || undefined,
				lyrics: metadata.lyrics || undefined,
			};
		} catch (error) {
			console.warn("Enrich local song failed:", error);
			return {};
		}
	})();
	enrichmentCache.set(song.url, promise);
	return promise;
}

/** 目录中存在 cover.jpg/png 等文件时，用作整个目录歌单的封面 */
export async function loadMusicFolderCover(): Promise<string> {
	const files = await fetchMusicFolderFiles();
	const cover = files.find((file) =>
		/^cover\.(jpg|jpeg|png|webp)$/i.test(file),
	);
	return cover ? `${baseUrl}music/${cover}` : "";
}
