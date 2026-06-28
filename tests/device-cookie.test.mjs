import assert from "node:assert/strict";
import test from "node:test";
import { createDeviceId } from "../dist/client/app/device-cookie.js";

test("uses native randomUUID when the secure-context API is available", () => {
  const expected = "123e4567-e89b-42d3-a456-426614174000";
  const actual = createDeviceId({
    randomUUID: () => expected,
    getRandomValues: () => {
      throw new Error("fallback should not run");
    }
  });

  assert.equal(actual, expected);
});

test("creates a standards-shaped UUID v4 with getRandomValues on LAN HTTP", () => {
  const actual = createDeviceId({
    getRandomValues: (bytes) => {
      bytes.set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
      return bytes;
    }
  });

  assert.equal(actual, "00010203-0405-4607-8809-0a0b0c0d0e0f");
  assert.match(actual, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});
