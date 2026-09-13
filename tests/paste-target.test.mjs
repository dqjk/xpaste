import assert from "node:assert/strict";
import test from "node:test";
import { isEditablePasteTarget } from "../dist/client/app/paste-target.js";

function buildTarget(properties) {
  return Object.assign(new EventTarget(), properties);
}

test("keeps native paste behavior for editable targets", () => {
  assert.equal(isEditablePasteTarget(buildTarget({ tagName: "input" })), true);
  assert.equal(isEditablePasteTarget(buildTarget({ tagName: "TEXTAREA" })), true);
  assert.equal(isEditablePasteTarget(buildTarget({ tagName: "SPAN", isContentEditable: true })), true);
});

test("allows global paste upload for non-editable targets", () => {
  assert.equal(isEditablePasteTarget(buildTarget({ tagName: "MAIN", isContentEditable: false })), false);
  assert.equal(isEditablePasteTarget(new EventTarget()), false);
  assert.equal(isEditablePasteTarget(null), false);
});
