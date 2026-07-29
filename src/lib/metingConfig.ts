// Meting API 配置 — 参考 Firefly 项目的逻辑
// 提供两种使用方式："meting" 通过 Meting API 获取在线音乐，"local" 使用本地音乐列表

export type MetingServer = "netease" | "tencent" | "kugou" | "xiami" | "baidu";
export type MetingType =
	| "song"
	| "playlist"
	| "album"
	| "search"
	| "artist"
	| "url";

export interface MetingApiConfig {
	// Meting API 地址模板，占位符 :server/:type/:id/:r 会被替换
	api: string;
	// 音乐平台：netease=网易云, tencent=QQ, kugou=酷狗, xiami=虾米, baidu=百度
	server: MetingServer;
	// 类型：song=单曲, playlist=歌单, album=专辑, search=搜索, artist=艺术家
	type: MetingType;
	// 歌单/专辑/单曲 ID 或搜索关键词
	id: string;
	// 认证 token（可选）
	auth?: string;
	// 备用 API 列表（主 API 失败时按顺序尝试）
	fallbackApis: string[];
}

export interface MetingConfig {
	// 默认音量 (0-1)
	volume: number;
	// 播放模式：'sequence'=列表循环, 'repeat-one'=单曲循环, 'shuffle'=随机
	playMode: "sequence" | "repeat-one" | "shuffle";
	// 是否显示歌词
	showLyrics: boolean;
	// 默认搜索服务（搜索面板使用）
	searchServer: MetingServer;
	// Meting API 配置（默认播放列表来源）
	meting: MetingApiConfig;
}

// 默认配置 — 与 Firefly 保持一致：网易云歌单 17426009449
export const metingConfig: MetingConfig = {
	volume: 0.8,
	playMode: "sequence",
	showLyrics: true,
	searchServer: "netease",
	meting: {
		api: "https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&r=:r",
		server: "netease",
		type: "playlist",
		id: "17426009449",
		auth: "",
		fallbackApis: [
			"https://api.injahow.cn/meting/?server=:server&type=:type&id=:id",
			"https://api.moeyao.cn/meting/?server=:server&type=:type&id=:id",
		],
	},
};

// 所有可用的服务器列表（用于移除／搜索切换）
export const METING_SERVERS: Array<{ value: MetingServer; label: string }> = [
	{ value: "netease", label: "网易云" },
	{ value: "tencent", label: "QQ音乐" },
	{ value: "kugou", label: "酷狗" },
	{ value: "xiami", label: "虾米" },
	{ value: "baidu", label: "百度" },
];

export function buildMetingUrl(
	template: string,
	server: string,
	type: string,
	id: string,
): string {
	return template
		.replace(":server", server)
		.replace(":type", type)
		.replace(":id", id)
		.replace(":r", Math.random().toString());
}
