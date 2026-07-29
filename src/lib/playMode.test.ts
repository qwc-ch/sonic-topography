import assert from "node:assert/strict";
import { test } from "vitest";
import { isRepeatOneMode, nextPlayMode } from "./playMode";

test("playMode", () => {
	assert.equal(nextPlayMode("sequence"), "shuffle");
	assert.equal(nextPlayMode("shuffle"), "repeat-one");
	assert.equal(nextPlayMode("repeat-one"), "sequence");
	assert.equal(isRepeatOneMode("repeat-one"), true);
	assert.equal(isRepeatOneMode("sequence"), false);
	assert.equal(isRepeatOneMode("shuffle"), false);
});
