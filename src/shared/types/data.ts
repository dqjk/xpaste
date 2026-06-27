export type SharedItemKind = "text" | "image" | "video" | "file";

export type TextSummary = {
  text: string;
  truncated?: boolean;
};

export type FileSummary = {
  name: string;
  size: number;
};

export type ImageSummary = FileSummary & {
  mimeType: string;
};

export type SharedItemSummary = {
  dataId: string;
  kind: SharedItemKind;
  createdAt: number;
  inline: boolean;
  available: boolean;
  mimeType: string;
  name?: string;
  size: number;
  summary: TextSummary | FileSummary | ImageSummary;
};

export type CreateTextDataRequest = {
  text: string;
};
