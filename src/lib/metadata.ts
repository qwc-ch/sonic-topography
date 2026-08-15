export interface AudioMetadata {
	displayName: string;
	title: string;
	artist: string;
	album: string;
	lyrics: string | null;
	cover: string | null;
	duration: number; // seconds, 0 if unknown
}

function getFallbackDisplayName(fallbackName: string): string {
	const decodedName = decodeURIComponent(fallbackName);
	return (
		decodedName
			.replace(/\.[^.]+$/, "")
			.replace(/[-_]+/g, " ")
			.trim() || "Demo Track"
	);
}

function pictureToDataUrl(
	picture: { data?: Uint8Array; format?: string } | undefined,
): string | null {
	if (!picture?.data?.length) return null;

	const chunkSize = 0x8000;
	let binary = "";
	for (let index = 0; index < picture.data.length; index += chunkSize) {
		binary += String.fromCharCode(
			...picture.data.subarray(index, index + chunkSize),
		);
	}

	return `data:${picture.format || "image/jpeg"};base64,${btoa(binary)}`;
}

function splitDisplayName(displayName: string): [string, string] {
	const index = displayName.indexOf(" - ");
	if (index > 0) {
		return [
			displayName.slice(0, index).trim(),
			displayName.slice(index + 3).trim(),
		];
	}
	return ["", displayName];
}

/** 从文件名推断标题与歌手（"歌手 - 标题.mp3" 模式） */
export function parseFileName(fileName: string): {
	title: string;
	artist: string;
} {
	const displayName = getFallbackDisplayName(fileName);
	const [artist, title] = splitDisplayName(displayName);
	return { title: title || displayName, artist };
}

export async function extractAudioMetadata(
	blob: Blob,
	fallbackName: string,
): Promise<AudioMetadata> {
	const fallbackDisplayName = getFallbackDisplayName(fallbackName);

	try {
		const mm = await import("music-metadata-browser");
		const metadata = await mm.parseBlob(blob);
		const title = metadata.common.title?.trim();
		const artist = metadata.common.artist?.trim();
		const album = metadata.common.album?.trim();
		const displayName = title
			? artist
				? `${artist} - ${title}`
				: title
			: fallbackDisplayName;
		const lyrics = metadata.common.lyrics?.find(Boolean) || null;
		const cover = pictureToDataUrl(metadata.common.picture?.[0]);
		const duration = Number.isFinite(metadata.format.duration)
			? metadata.format.duration || 0
			: 0;

		if (title) {
			return {
				displayName,
				title,
				artist: artist || "",
				album: album || "",
				lyrics,
				cover,
				duration,
			};
		}

		const [fallbackArtist, fallbackTitle] = splitDisplayName(displayName);
		return {
			displayName,
			title: fallbackTitle,
			artist: fallbackArtist,
			album: album || "",
			lyrics,
			cover,
			duration,
		};
	} catch (error) {
		console.warn("Error reading tags with music-metadata-browser:", error);
	}

	const [fallbackArtist, fallbackTitle] = splitDisplayName(fallbackDisplayName);
	return {
		displayName: fallbackDisplayName,
		title: fallbackTitle,
		artist: fallbackArtist,
		album: "",
		lyrics: null,
		cover: null,
		duration: 0,
	};
}

export async function extractLyricsFromAudio(
	file: File,
): Promise<string | null> {
	const metadata = await extractAudioMetadata(file, file.name);
	return metadata.lyrics;
}
