# xpaste UI Design Draft

This folder stores the project-owned visual design baseline. Future UI work should use these assets as the reference instead of relying on external design tools.

## Current Draft

### Page Layout

- `xpaste-responsive-ui-draft.png`

### Theme And State

- `xpaste-dark-mode-availability-draft.png`

### Components

- `xpaste-dataitem-card-draft.png`
- `xpaste-device-connect-entry-draft.svg`
- `xpaste-device-connect-modal-draft.svg`

## Verified Implementation Screenshots

- `xpaste-desktop-verified.png`
- `xpaste-tablet-verified.png`
- `xpaste-mobile-verified.png`
- `xpaste-impl-desktop-light.png`
- `xpaste-impl-desktop-dark.png`
- `xpaste-impl-tablet-dark.png`
- `xpaste-impl-mobile-dark.png`

The draft shows three responsive targets:

- Desktop: compact Quick Share at the top, then a multi-column DataItem grid.
- Tablet: same structure with fewer columns and wrapped Quick Share actions.
- Mobile: one-column DataItem flow with a compact Quick Share area.

## Design Rules

- The UI is use-and-leave: users should focus on pasting or uploading content, then retrieving DataItems.
- Do not add sidebars, menus, bottom tabs, search bars, avatars, floating add buttons, or layout switch controls.
- Keep only a small settings button in the top-right.
- Quick Share is paste-first. `Paste from Clipboard` is the primary action.
- Text input is secondary and uses `Send`; there is no separate `Text` quick action.
- Media actions are secondary: `Image`, `File`, `Video`, and `Album` on mobile.
- DataItem cards prioritize content preview, then actions, then compact source info.
- Card actions use `icon + text` across desktop, tablet, and mobile.
- Non-inline resources such as files, images, and videos must expose availability in the card footer area, near the type icon and source metadata. The top area should stay focused on content.
- Inline or immediate-consumption cards, such as text, do not show `Available` or `Unavailable`.
- Unavailable non-inline cards are muted and actions are disabled.
- Source info stays compact: device/OS icon, display name, and IP.
- Light and dark color schemes must both be designed before implementation.
- Desktop device connection uses a compact top-bar entry and an application-generated QR code.
- Keep the closed entry and open modal as separate design drafts.

## Pending Design Review

- `xpaste-dark-mode-availability-draft.png` proposes dark mode colors and moves availability state from the top-right of the card to the bottom-right footer area.
- `xpaste-dataitem-card-draft.png` isolates DataItem card components. It intentionally excludes app chrome, phone frames, settings buttons, and page-level controls.
- Implementation should wait until this design direction is confirmed.

## Verification Target

When implementing or tuning the real UI, verify at least:

- Desktop width: multiple DataItem cards per row.
- Tablet width: fewer DataItem cards per row.
- Mobile width: single-column DataItem cards.
- Quick Share remains compact and paste-first on all widths.
- DataItem action buttons remain visible without overpowering card content.
