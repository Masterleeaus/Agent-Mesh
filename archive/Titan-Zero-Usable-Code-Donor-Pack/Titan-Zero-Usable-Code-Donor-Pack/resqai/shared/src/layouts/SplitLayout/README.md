# SplitLayout

Resizable split pane layout supporting horizontal (left/right) and vertical (top/bottom) orientations.

## Zones

| Slot     | Description                 |
|----------|-----------------------------|
| `left`   | Left/top pane content       |
| `right`  | Right/bottom pane content   |

## Props

- `defaultRatio` — initial split ratio (default 0.5)
- `minLeftWidth` / `minRightWidth` — minimum pane sizes in px
- `gutter` — draggable gutter width in px (default 4)
- `direction` — `'horizontal'` (default) or `'vertical'`

## Behavior

- Drag the gutter handle to resize panes
- Respects minimum width constraints for each pane
- Mouse-based drag with pointer capture
