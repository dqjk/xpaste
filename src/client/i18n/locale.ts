const englishMessages = {
  "items.heading": "DataItems",
  "settings.label": "Settings",
  "action.copy": "Copy",
  "action.preview": "Preview",
  "action.open": "Open",
  "action.save": "Save",
  "status.available": "Available",
  "status.unavailable": "Unavailable",
  "quick.inputPlaceholder": "Enter text to send...",
  "quick.send": "Send",
  "quick.paste": "Paste from Clipboard",
  "quick.image": "Image",
  "quick.album": "Album",
  "quick.file": "File",
  "quick.video": "Video",
  "quick.dropHint": "Drag and drop files, images, or videos anywhere to send"
} as const;

export type SupportedLocale = "en" | "zh-CN";
export type TranslationKey = keyof typeof englishMessages;
export type Translator = (key: TranslationKey) => string;

const simplifiedChineseMessages: Record<TranslationKey, string> = {
  "items.heading": "共享内容",
  "settings.label": "设置",
  "action.copy": "复制",
  "action.preview": "预览",
  "action.open": "打开",
  "action.save": "保存",
  "status.available": "可用",
  "status.unavailable": "不可用",
  "quick.inputPlaceholder": "输入要发送的文本...",
  "quick.send": "发送",
  "quick.paste": "粘贴剪贴板内容",
  "quick.image": "图片",
  "quick.album": "相册",
  "quick.file": "文件",
  "quick.video": "视频",
  "quick.dropHint": "拖放文件、图片或视频到页面任意位置即可发送"
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
