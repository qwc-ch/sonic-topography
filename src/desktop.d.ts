export {};

// Desktop/Electron 集成已移除：现在为纯 Web 应用。
// 保留全局类型以兼容现有引用，但 sonicDesktop 始终为 undefined。
interface SonicDesktop {
	isDesktop: boolean;
	supportsSystemAudioLoopback?: boolean;
	openUpdateInstaller?: (
		filePath: string,
	) => Promise<{ ok: boolean; error?: string }>;
	openUpdateRelease?: (
		releaseUrl: string,
	) => Promise<{ ok: boolean; error?: string }>;
}

declare global {
	interface Window {
		sonicDesktop?: SonicDesktop;
	}
}
