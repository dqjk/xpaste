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

test("uses size and local creation time without repeating rich-media file names or extensions", () => {
  const createdAt = new Date(2026, 8, 13, 14, 31, 54).getTime();
  const viewModel = buildApplicationViewModel([
    buildDevice([
      {
        dataId: "image-1",
        kind: "image",
        createdAt,
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
  assert.equal(viewModel.items[0].preview, "1.5 KB · 14:31:54");
  assert.equal(viewModel.items[0].timeLabel, "14:31:54");
  assert.doesNotMatch(viewModel.items[0].preview, /Lake Photo/);
  assert.doesNotMatch(viewModel.items[0].preview, /PNG/);
});

test("uses the same size and creation time metadata for generic files", () => {
  const createdAt = new Date(2026, 8, 13, 14, 30, 21).getTime();
  const viewModel = buildApplicationViewModel([
    buildDevice([
      {
        dataId: "file-1",
        kind: "file",
        createdAt,
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
  assert.equal(viewModel.items[0].preview, "13 B · 14:30:21");
  assert.equal(viewModel.items[0].timeLabel, "14:30:21");
});
