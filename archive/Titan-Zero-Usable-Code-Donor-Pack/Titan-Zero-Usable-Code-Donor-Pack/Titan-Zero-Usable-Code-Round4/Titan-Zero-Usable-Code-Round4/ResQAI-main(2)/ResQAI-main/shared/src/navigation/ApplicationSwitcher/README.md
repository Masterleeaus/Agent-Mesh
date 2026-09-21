# ApplicationSwitcher

Dropdown menu for switching between applications or modules.

## Props

- `apps` — array of `AppLink` objects with `id`, `label`, optional `icon`, `description`, `badge`
- `currentAppId` — currently active app ID
- `onSelect` — callback when an app is selected
- `label` — default button label when no app is selected (default `'Applications'`)
- `compact` — reduced height variant

## Behavior

- Click outside closes the dropdown
- Current app is highlighted with a checkmark
- Disabled apps show reduced opacity and block interaction
- Badges render as accent-colored pills
