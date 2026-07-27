const englishMessages = {
  "items.heading": "DataItems",
  "action.copy": "Copy",
  "action.open": "Open",
  "action.save": "Save",
  "status.available": "Available",
  "status.unavailable": "Unavailable",
  "quick.inputPlaceholder": "Enter text or paste anywhere...",
  "quick.send": "Send",
  "quick.image": "Image",
  "quick.album": "Album",
  "quick.file": "File",
  "quick.video": "Video",
  "quick.dropHint": "Paste anywhere to auto-send · Drag and drop files, images, or videos",
  "text.showMore": "Show more ↓",
  "text.showLess": "Show less ↑",
  "feedback.dismiss": "Dismiss",
  "feedback.clipboardWrite.title": "Manual copy required",
  "feedback.clipboardWrite.message": "Automatic copy is unavailable. The text is selected; press Ctrl+C or long-press to copy.",
  "feedback.upload.title": "Upload failed",
  "feedback.upload.message": "The file is too large or the connection was interrupted. Try again, or choose a smaller file.",
  "feedback.generic.title": "Action failed",
  "feedback.generic.message": "The action could not be completed. Check the connection and try again."
} as const;

export type SupportedLocale = "en" | "zh-CN";
export type TranslationKey = keyof typeof englishMessages;
export type Translator = (key: TranslationKey) => string;

const simplifiedChineseMessages: Record<TranslationKey, string> = {
  "items.heading": "共享内容",
  "action.copy": "复制",
  "action.open": "打开",
  "action.save": "保存",
  "status.available": "可用",
  "status.unavailable": "不可用",
  "quick.inputPlaceholder": "输入文本，或在页面任意位置粘贴...",
  "quick.send": "发送",
  "quick.image": "图片",
  "quick.album": "相册",
  "quick.file": "文件",
  "quick.video": "视频",
  "quick.dropHint": "在页面任意位置粘贴即可自动发送 · 也可拖放文件、图片或视频",
  "text.showMore": "展开全文 ↓",
  "text.showLess": "收起 ↑",
  "feedback.dismiss": "关闭",
  "feedback.clipboardWrite.title": "需要手动复制",
  "feedback.clipboardWrite.message": "当前连接无法自动复制，文本已选中；请按 Ctrl+C 或长按复制。",
  "feedback.upload.title": "上传失败",
  "feedback.upload.message": "文件过大或连接已中断。请重试，或选择更小的文件。",
  "feedback.generic.title": "操作失败",
  "feedback.generic.message": "操作未能完成，请检查连接后重试。"
};

const messagesByLocale: Record<SupportedLocale, Readonly<Record<TranslationKey, string>>> = {
  en: englishMessages,
  "zh-CN": simplifiedChineseMessages
};

/**
 * Negotiates the first supported locale from the browser's ordered language preferences.
 *
 * All Chinese language tags intentionally use the Simplified Chinese catalog because it is
 * the only Chinese variant currently shipped. Unsupported languages fall back to English.
 */
export function resolveLocale(languages: readonly string[]): SupportedLocale {
  for (const language of languages) {
    const normalizedLanguage = language.toLowerCase();
    if (normalizedLanguage === "zh" || normalizedLanguage.startsWith("zh-")) {
      return "zh-CN";
    }

    if (normalizedLanguage === "en" || normalizedLanguage.startsWith("en-")) {
      return "en";
    }
  }

  return "en";
}

/**
 * Resolves the locale directly from the browser without storing a user preference.
 */
export function getBrowserLocale(): SupportedLocale {
  const languages = navigator.languages.length > 0 ? navigator.languages : [navigator.language];
  return resolveLocale(languages);
}

/**
 * Creates an immutable, locale-bound translator for explicit dependency injection into UI code.
 */
export function createTranslator(locale: SupportedLocale): Translator {
  const messages = messagesByLocale[locale];
  return (key) => messages[key];
}
