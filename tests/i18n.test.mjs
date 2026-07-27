import assert from "node:assert/strict";
import test from "node:test";
import { createTranslator, resolveLocale } from "../dist/client/i18n/locale.js";

test("resolves Chinese browser locales to Simplified Chinese", () => {
  for (const language of ["zh", "zh-CN", "zh-Hans-SG", "zh-TW"]) {
    assert.equal(resolveLocale([language]), "zh-CN");
  }
});

test("resolves English browser locales to English", () => {
  assert.equal(resolveLocale(["en", "en-US", "zh-CN"]), "en");
});

test("uses the first supported browser preference and falls back to English", () => {
  assert.equal(resolveLocale(["fr-FR", "zh-CN"]), "zh-CN");
  assert.equal(resolveLocale(["fr-FR", "de-DE"]), "en");
  assert.equal(resolveLocale([]), "en");
});

test("provides the expected interface messages for both locales", () => {
  const english = createTranslator("en");
  const simplifiedChinese = createTranslator("zh-CN");

  assert.equal(english("quick.inputPlaceholder"), "Enter text or paste anywhere...");
  assert.equal(english("status.unavailable"), "Unavailable");
  assert.equal(english("feedback.clipboardWrite.title"), "Manual copy required");
  assert.equal(simplifiedChinese("quick.inputPlaceholder"), "输入文本，或在页面任意位置粘贴...");
  assert.equal(simplifiedChinese("status.unavailable"), "不可用");
  assert.equal(simplifiedChinese("feedback.upload.title"), "上传失败");
});
