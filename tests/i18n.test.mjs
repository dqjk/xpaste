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

  assert.equal(english("quick.paste"), "Paste from Clipboard");
  assert.equal(english("status.unavailable"), "Unavailable");
  assert.equal(simplifiedChinese("quick.paste"), "粘贴剪贴板内容");
  assert.equal(simplifiedChinese("status.unavailable"), "不可用");
});
