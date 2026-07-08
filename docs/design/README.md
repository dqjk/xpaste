# xpaste UI Design Baseline

[简体中文](./README.zh-CN.md)

This directory contains only the current UI design baseline. Each design is a standalone PNG with no dependency on another draft or external design tool.

## Current Designs

- `xpaste-desktop-light.png`
- `xpaste-desktop-dark.png`
- `xpaste-tablet-light.png`
- `xpaste-tablet-dark.png`
- `xpaste-mobile-light.png`
- `xpaste-mobile-dark.png`

## Design Rules

- Quick Share is the first visible section. Do not add a toolbar, brand bar, settings button, sidebar, tab bar, search field, avatar, floating action button, or layout switcher.
- Paste is the primary Quick Share action. Text input and media selection are secondary actions.
- Desktop uses a fluid multi-column DataItem grid, tablet reduces the column count, and mobile uses a single column.
- DataItem actions use an icon and label on every viewport.
- Non-inline resources show availability on the title row, vertically aligned with the title and anchored to the right edge.
- Long titles truncate before the availability badge; the badge never overlaps or pushes the title out of the card.
- Inline text items do not show availability.
- Unavailable non-inline cards are muted and their actions are disabled.
- Device source information stays compact: platform/device icon, display name, and IP address.
- Light and dark themes share the same geometry.
- English and Simplified Chinese share the same responsive geometry. Locale follows browser language without a manual selector.

## Workflow

Update these designs and obtain confirmation before changing production UI code. After implementation, verify desktop, tablet, and mobile in a real browser and compare screenshots against this baseline.
