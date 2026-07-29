import type { SavedPlaylist } from "../types";

export const PLAYLIST_STORAGE_KEY = "sonic-topography-playlists-v1";
const SIDE_NAV_HINT_STORAGE_KEY = "sonic-topography-side-nav-hint-seen-v1";

function getStorage(storage?: Storage): Storage | null {
	if (storage) return storage;
	return typeof window === "undefined" ? null : window.localStorage;
}

export function readSideNavHintSeen(storage?: Storage) {
	return getStorage(storage)?.getItem(SIDE_NAV_HINT_STORAGE_KEY) === "1";
}

export function writeSideNavHintSeen(storage?: Storage) {
	getStorage(storage)?.setItem(SIDE_NAV_HINT_STORAGE_KEY, "1");
}

export function createDefaultPlaylists(): SavedPlaylist[] {
	return [
		{ id: "favorites", name: "收藏", songs: [] },
		{ id: "visual-set", name: "Visual Set", songs: [] },
	];
}

export function normalizeSavedPlaylists(value: unknown): SavedPlaylist[] {
	if (!Array.isArray(value) || value.length === 0)
		return createDefaultPlaylists();
	return value.map((playlist) => {
		const candidate = playlist as Partial<SavedPlaylist>;
		return {
			id: String(candidate.id || `playlist-${Date.now()}`),
			name: String(candidate.name || "歌单"),
			songs: Array.isArray(candidate.songs) ? candidate.songs : [],
		};
	});
}

export function readSavedPlaylists(storage?: Storage): SavedPlaylist[] {
	try {
		const raw = getStorage(storage)?.getItem(PLAYLIST_STORAGE_KEY);
		return raw
			? normalizeSavedPlaylists(JSON.parse(raw))
			: createDefaultPlaylists();
	} catch (error) {
		console.warn("Unable to read saved playlists:", error);
		return createDefaultPlaylists();
	}
}

export function writeSavedPlaylists(
	playlists: SavedPlaylist[],
	storage?: Storage,
) {
	getStorage(storage)?.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(playlists));
}

export function hasSavedSongs(playlists: SavedPlaylist[]): boolean {
	return playlists.some((playlist) => playlist.songs.length > 0);
}
