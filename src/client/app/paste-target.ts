type PasteTargetShape = EventTarget & {
  readonly isContentEditable?: unknown;
  readonly tagName?: unknown;
};

/**
 * Returns whether a paste target must retain native editing behavior.
 *
 * Structural checks avoid realm-specific `instanceof` failures when an editable element comes
 * from an embedded document while keeping the function independently testable.
 */
export function isEditablePasteTarget(target: EventTarget | null): boolean {
  if (!target) {
    return false;
  }

  const candidate = target as PasteTargetShape;
  const tagName = typeof candidate.tagName === "string" ? candidate.tagName.toUpperCase() : "";
  return tagName === "INPUT" || tagName === "TEXTAREA" || candidate.isContentEditable === true;
}
