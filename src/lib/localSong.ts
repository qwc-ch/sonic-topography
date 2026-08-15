// 本地文件歌曲：把本地音频文件包装成 MetingSong 形状（provider: "local"），
// 从而与 Meting 在线歌曲共用同一套队列/播放逻辑。

import type { MetingSong } from "../types";
import { extractAudioMetadata } from "./metadata";

export const LOCAL_PROVIDER = "local" as const;

export function isLocalSong(
	song: MetingSong | null | undefined,
): song is MetingSong & { provider: "local" } {
	return Boolean(song && song.provider === "local");
}

function stripExtension(name: string): string {
	return name.replace(/\.[^.]+$/, "").toLowerCase();
}

let idCounter = 0;

function nextLocalId(): string {
	idCounter += 1;
	return `local-${Date.now()}-${idCounter}`;
}

export interface CreateLocalSongsOptions {
	/** 同名 .lrc 歌词文本，键为去掉扩展名的小写文件名 */
	lrcByBaseName?: Map<string, string>;
}

/**
 * 把本地音频文件转换为可播放的本地歌曲条目。
 * - url 为 blob object URL（仅本次会话有效）
 * - 歌词优先取同名 .lrc 侧边文件，其次取音频内嵌歌词
 * - duration 单位毫秒，与 MetingSong 约定一致（未知时为 0）
 */
export async function createLocalSongs(
	files: File[],
	options: CreateLocalSongsOptions = {},
): Promise<MetingSong[]> {
	const lrcByBaseName = options.lrcByBaseName || new Map<string, string>();
	const songs: MetingSong[] = [];

	for (const file of files) {
		const metadata = await extractAudioMetadata(file, file.name);
		const url = URL.createObjectURL(file);
		const sidecarLrc = lrcByBaseName.get(stripExtension(file.name));
		const lrc = sidecarLrc || metadata.lyrics || "";

		songs.push({
			id: nextLocalId(),
			name: metadata.title || file.name,
			artist: metadata.artist || "未知歌手",
			album: metadata.album || "",
			cover: metadata.cover || "",
			url,
			lrc,
			duration: Math.round(metadata.duration * 1000),
			provider: LOCAL_PROVIDER,
		});
	}

	return songs;
}
