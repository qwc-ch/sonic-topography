import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AudioDebugger } from "./components/AudioDebugger/AudioDebugger";
import { MapScene } from "./components/AudioVisualizer/MapScene";
import { UI } from "./components/UI/UI";
import {
	readGroundEqSettingsStorage,
	type StoredGroundEqSettings,
	writeGroundEqSettingsStorage,
} from "./lib/groundEqSettings";
import {
	type LyricsSettings,
	readLyricsSettingsStorage,
	writeLyricsSettingsStorage,
} from "./lib/lyricsSettings";
import {
	DEFAULT_CAMERA_POSITION,
	GLOBAL_SCENE_SETTINGS_STORAGE_KEY,
	type GlobalSceneSettings,
	readGlobalSceneSettingsStorage,
} from "./lib/sceneDefaults";
import {
	BUILT_IN_THEME_IDS,
	CUSTOM_THEME_ID,
	type CustomThemeSettings,
	createCustomThemeColors,
	readActiveCustomThemeStorage,
	readActiveThemeStorage,
	readCustomThemeStorage,
	readThemeRotationStorage,
	type ThemeRotationSettings,
	themes,
	writeActiveCustomThemeStorage,
	writeActiveThemeStorage,
	writeCustomThemeStorage,
	writeThemeRotationStorage,
} from "./lib/themes";

function readInitialCustomThemeState() {
	const presets = readCustomThemeStorage();
	return {
		presets,
		activeId: readActiveCustomThemeStorage(presets),
	};
}

export default function App() {
	const [theme, setTheme] = useState(readActiveThemeStorage);
	const [groundEqSettings, setGroundEqSettings] =
		useState<StoredGroundEqSettings>(readGroundEqSettingsStorage);
	const [customThemeState, setCustomThemeState] = useState(
		readInitialCustomThemeState,
	);
	const customThemes = customThemeState.presets;
	const activeCustomThemeId = customThemeState.activeId;
	const activeCustomTheme =
		customThemes.find((preset) => preset.id === activeCustomThemeId) ||
		customThemes[0];
	const availableRotationThemeIds = useMemo(
		() => [...BUILT_IN_THEME_IDS, ...customThemes.map((preset) => preset.id)],
		[customThemes],
	);
	const [themeRotation, setThemeRotation] = useState<ThemeRotationSettings>(
		() => readThemeRotationStorage(availableRotationThemeIds),
	);
	const [lyricsSettings, setLyricsSettings] = useState<LyricsSettings>(
		readLyricsSettingsStorage,
	);
	const [showDebugger, setShowDebugger] = useState(false);
	const [currentLyricsText, setCurrentLyricsText] = useState("");
	const [lyricsVisible, setLyricsVisible] = useState(true);
	const [coverVisible, setCoverVisible] = useState(true);
	const [globalSceneSettings, setGlobalSceneSettings] =
		useState<GlobalSceneSettings>(readGlobalSceneSettingsStorage);

	// Track current song to pass cover to 3D scene
	const [currentSong, setCurrentSong] = useState<Record<
		string,
		unknown
	> | null>(null);

	const [isPerspectiveEditMode, setIsPerspectiveEditMode] = useState(false);
	const [resetCameraTrigger, setResetCameraTrigger] = useState(0);

	useEffect(() => {
		localStorage.setItem(
			GLOBAL_SCENE_SETTINGS_STORAGE_KEY,
			JSON.stringify(globalSceneSettings),
		);
	}, [globalSceneSettings]);

	const updateGlobalSceneSettings = (patch: { rotationSpeed?: number }) => {
		setGlobalSceneSettings((prev) => ({ ...prev, ...patch }));
	};

	const resolvedTheme =
		theme === CUSTOM_THEME_ID
			? createCustomThemeColors(activeCustomTheme)
			: themes[theme] || themes["ink-wash"];
	const sceneRotationSpeed = globalSceneSettings.rotationSpeed;

	const updateTheme = useCallback((themeId: string) => {
		setTheme(themeId);
		writeActiveThemeStorage(themeId);
	}, []);

	const updateCustomThemes = useCallback(
		(settings: CustomThemeSettings[], activeId = activeCustomThemeId) => {
			setCustomThemeState({ presets: settings, activeId });
			writeCustomThemeStorage(settings);
			writeActiveCustomThemeStorage(activeId);
		},
		[activeCustomThemeId],
	);

	const activateThemeId = useCallback(
		(themeId: string) => {
			if (BUILT_IN_THEME_IDS.includes(themeId)) {
				updateTheme(themeId);
				return;
			}

			if (customThemes.some((preset) => preset.id === themeId)) {
				updateCustomThemes(customThemes, themeId);
				updateTheme(CUSTOM_THEME_ID);
			}
		},
		[customThemes, updateTheme, updateCustomThemes],
	);

	const updateThemeRotation = (settings: ThemeRotationSettings) => {
		setThemeRotation(settings);
		writeThemeRotationStorage(settings, availableRotationThemeIds);
	};

	const updateGroundEqSettings = (settings: StoredGroundEqSettings) => {
		setGroundEqSettings(settings);
		writeGroundEqSettingsStorage(settings);
	};

	useEffect(() => {
		const normalized = readThemeRotationStorage(availableRotationThemeIds);
		setThemeRotation((current) => {
			const nextThemeIds = current.themeIds.filter((id) =>
				availableRotationThemeIds.includes(id),
			);
			const next = {
				...current,
				themeIds: nextThemeIds.length ? nextThemeIds : normalized.themeIds,
			};
			writeThemeRotationStorage(next, availableRotationThemeIds);
			return next;
		});
	}, [availableRotationThemeIds]);

	useEffect(() => {
		if (!themeRotation.enabled || themeRotation.themeIds.length < 2) return;

		const timer = window.setInterval(() => {
			const currentThemeId =
				theme === CUSTOM_THEME_ID ? activeCustomThemeId : theme;
			const currentIndex = themeRotation.themeIds.indexOf(currentThemeId);
			const nextIndex =
				currentIndex >= 0
					? (currentIndex + 1) % themeRotation.themeIds.length
					: 0;
			activateThemeId(themeRotation.themeIds[nextIndex]);
		}, themeRotation.intervalSeconds * 1000);

		return () => window.clearInterval(timer);
	}, [themeRotation, theme, activeCustomThemeId, activateThemeId]);

	const updateLyricsSettings = (newSettings: LyricsSettings) => {
		setLyricsSettings(newSettings);
		writeLyricsSettingsStorage(newSettings);
	};

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "`" || e.key === "~") {
				setShowDebugger((prev) => !prev);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	// Convert THREE.Color to css strings
	const backdropColor = `#${resolvedTheme.uFogColor.getHexString()}`;

	return (
		<div
			className="relative min-h-[100dvh] w-screen overflow-hidden text-[#94a3b8] font-sans selection:bg-blue-500/30 transition-colors duration-1000"
			style={{ backgroundColor: backdropColor }}
		>
			<UI
				theme={theme}
				resolvedTheme={resolvedTheme}
				customThemes={customThemes}
				activeCustomThemeId={activeCustomThemeId}
				themeRotation={themeRotation}
				groundEqSettings={groundEqSettings}
				onThemeChange={updateTheme}
				onCustomThemesChange={updateCustomThemes}
				onThemeRotationChange={updateThemeRotation}
				onGroundEqSettingsChange={updateGroundEqSettings}
				lyricsSettings={lyricsSettings}
				onLyricsSettingsChange={updateLyricsSettings}
				globalSceneSettings={globalSceneSettings}
				onGlobalSceneSettingsChange={updateGlobalSceneSettings}
				onCurrentSongChange={setCurrentSong}
				onCurrentLyricsChange={setCurrentLyricsText}
				onLyricsVisibilityChange={setLyricsVisible}
				onCoverVisibilityChange={setCoverVisible}
				isPerspectiveEditMode={isPerspectiveEditMode}
				onPerspectiveEditModeChange={setIsPerspectiveEditMode}
				onResetCamera={() => setResetCameraTrigger((prev) => prev + 1)}
			/>
			<div className="absolute inset-0 z-0">
				<Canvas camera={{ position: DEFAULT_CAMERA_POSITION, fov: 45 }}>
					<MapScene
						themeColors={resolvedTheme}
						groundEqSettings={groundEqSettings}
						rotationSpeed={sceneRotationSpeed}
						coverUrl={
							coverVisible
								? currentSong?.cover || currentSong?.picUrl || ""
								: ""
						}
						lyricsText={currentLyricsText || null}
						lyricsSettings={lyricsSettings}
						lyricsVisible={lyricsVisible}
						isPerspectiveEditMode={isPerspectiveEditMode}
						resetCameraTrigger={resetCameraTrigger}
					/>
				</Canvas>
			</div>
			{showDebugger && <AudioDebugger onClose={() => setShowDebugger(false)} />}
		</div>
	);
}
