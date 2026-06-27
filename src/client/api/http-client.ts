import type { CreateTextDataRequest } from "../../shared/index.js";

/**
 * Sends a text payload through the shared data endpoint.
 */
export async function postTextData(payload: CreateTextDataRequest): Promise<void> {
  const response = await fetch("/data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`text upload failed with status ${response.status}`);
  }
}

/**
 * Sends a single file or image through the shared data endpoint.
 */
export async function postFileData(file: File): Promise<void> {
  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch("/data", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error(`file upload failed with status ${response.status}`);
  }
}
