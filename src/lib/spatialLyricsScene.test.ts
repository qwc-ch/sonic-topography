import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { test } from "vitest";

test("spatialLyricsScene", () => {
	const currentDir = dirname(fileURLToPath(import.meta.url));
	const appSource = readFileSync(resolve(currentDir, "../App.tsx"), "utf8");
	const uiSource = readFileSync(
		resolve(currentDir, "../components/UI/UI.tsx"),
		"utf8",
	);
	const mapSceneSource = readFileSync(
		resolve(currentDir, "../components/AudioVisualizer/MapScene.tsx"),
		"utf8",
	);
	const spatialLyricsSource = readFileSync(
		resolve(currentDir, "../components/AudioVisualizer/SpatialLyrics3D.tsx"),
		"utf8",
	);

	assert.match(
		appSource,
		/const \[currentLyricsText, setCurrentLyricsText\] = useState\(""\)/,
	);
	assert.match(
		appSource,
		/const \[lyricsVisible, setLyricsVisible\] = useState\(true\)/,
	);
	assert.match(appSource, /onCurrentLyricsChange=\{setCurrentLyricsText\}/);
	assert.match(appSource, /onLyricsVisibilityChange=\{setLyricsVisible\}/);
	assert.match(appSource, /lyricsText=\{currentLyricsText \|\| null\}/);
	assert.match(appSource, /lyricsVisible=\{lyricsVisible\}/);
	assert.doesNotMatch(appSource, /lyricsText=\{currentSong\?\.lyrics/);

	assert.match(uiSource, /onCurrentLyricsChange\?: \(lyrics: string\) => void/);
	assert.match(
		uiSource,
		/onLyricsVisibilityChange\?: \(visible: boolean\) => void/,
	);
	assert.match(uiSource, /onCurrentLyricsChange\?\.\(lyricsText\)/);
	assert.match(
		uiSource,
		/onLyricsVisibilityChange\?\.\(displaySettings\.showLyrics\)/,
	);

	const platterGroupIndex = mapSceneSource.indexOf(
		"<group ref={visualPlatterRef}>",
	);
	const platterGroupEndIndex = mapSceneSource.indexOf(
		"\n\t\t\t</group>",
		platterGroupIndex,
	);
	const spatialLyricsIndex = mapSceneSource.indexOf("<SpatialLyrics3D");
	const coverIndex = mapSceneSource.indexOf("<coverShaderMaterial");
	assert.ok(
		platterGroupIndex >= 0 && platterGroupEndIndex > platterGroupIndex,
		"MapScene should render a visual platter group",
	);
	assert.ok(
		spatialLyricsIndex > platterGroupEndIndex,
		"3D lyrics should stay outside the rotating platter",
	);
	assert.ok(
		coverIndex > platterGroupEndIndex,
		"cover screen should stay outside the rotating platter",
	);
	assert.match(
		mapSceneSource,
		/lyricsSettings\?\.style === "spatial-wall" && lyricsText/,
	);
	assert.match(mapSceneSource, /lyricsVisible\?: boolean/);
	assert.match(mapSceneSource, /visible=\{lyricsVisible\}/);

	assert.match(spatialLyricsSource, /parseLRC\(lrcText\)/);
	assert.match(
		spatialLyricsSource,
		/export const COVER_SCREEN_POSITION = \[110, 24, -110\] as const/,
	);
	assert.match(
		spatialLyricsSource,
		/export const COVER_SCREEN_ROTATION = \[0, -Math\.PI \/ 4, 0\] as const/,
	);
	assert.match(
		spatialLyricsSource,
		/export const SPATIAL_LYRICS_LEFT_OFFSET = 18/,
	);
	assert.match(
		spatialLyricsSource,
		/const SPATIAL_LYRICS_ARC_HALF_ANGLE = 0\.58/,
	);
	assert.match(
		spatialLyricsSource,
		/new THREE\.CanvasTexture\(canvasInactive\)/,
	);
	assert.match(spatialLyricsSource, /new THREE\.CanvasTexture\(canvasActive\)/);
	assert.match(spatialLyricsSource, /const visualEnergyRef = useRef\(0\)/);
	assert.match(
		spatialLyricsSource,
		/const baseHex = lyricsSettings\.fontColor/,
	);
	assert.match(
		spatialLyricsSource,
		/const \[activeIndex, setActiveIndex\] = useState\(-1\)/,
	);
	assert.match(spatialLyricsSource, /function renderCurrentLyricTextures\(\)/);
	assert.match(spatialLyricsSource, /const CANVAS_SAFE_TEXT_WIDTH = 1880/);
	assert.match(spatialLyricsSource, /const ACTIVE_MAX_FONT_SIZE = 260/);
	assert.match(spatialLyricsSource, /const SPATIAL_LYRICS_MAX_LINES = 8/);
	assert.match(
		spatialLyricsSource,
		/const LINE_BOUNDS_HALF_STEP_RATIO = 0\.48/,
	);
	assert.match(spatialLyricsSource, /fog=\{false\}/);
	assert.match(spatialLyricsSource, /depthTest=\{false\}/);
	assert.match(spatialLyricsSource, /toneMapped=\{false\}/);
	assert.match(spatialLyricsSource, /depthWrite=\{false\}/);
	assert.match(
		spatialLyricsSource,
		/uBaseColor\.value\.setRGB\(1\.0, 1\.0, 1\.0\)/,
	);
	assert.match(spatialLyricsSource, /const SPATIAL_LYRICS_FONT_SCALE = 4/);
	assert.match(spatialLyricsSource, /const SPATIAL_LYRICS_WORLD_SCALE = 5/);
	assert.match(spatialLyricsSource, /meshRef\.current\.scale\.set\(/);
	assert.match(
		spatialLyricsSource,
		/const spatialLyricsWidthScale = useMemo\(\(\) =>/,
	);
});
