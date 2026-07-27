import assert from "node:assert/strict";
import test from "node:test";
import { buildApplicationViewModel } from "../dist/client/state/view-model.js";

function buildDevice(data) {
  return {
    deviceId: "device-1",
    displayName: "Windows Chrome",
    ip: "192.168.1.20",
    data
  };
}

test("uses size and format without repeating rich-media file names", () => {
  const viewModel = buildApplicationViewModel([
    buildDevice([
      {
        dataId: "image-1",
        kind: "image",
        createdAt: 1,
        inline: false,
        available: true,
        mimeType: "image/png",
        size: 1536,
        name: "Lake Photo.png",
        summary: { name: "Lake Photo.png" }
      }
    ])
  ]);

  assert.equal(viewModel.items[0].title, "Lake Photo.png");
  assert.equal(viewModel.items[0].preview, "1.5 KB · PNG");
  assert.doesNotMatch(viewModel.items[0].preview, /Lake Photo/);
});

test("keeps file metadata out of the card presentation contract", () => {
  const viewModel = buildApplicationViewModel([
    buildDevice([
      {
        dataId: "file-1",
        kind: "file",
        createdAt: 1,
        inline: false,
        available: true,
        mimeType: "application/pdf",
        size: 13,
        name: "Project Plan.pdf",
        summary: { name: "Project Plan.pdf" }
      }
    ])
  ]);

  assert.equal(viewModel.items[0].title, "Project Plan.pdf");
  assert.equal(viewModel.items[0].preview, "");
});
