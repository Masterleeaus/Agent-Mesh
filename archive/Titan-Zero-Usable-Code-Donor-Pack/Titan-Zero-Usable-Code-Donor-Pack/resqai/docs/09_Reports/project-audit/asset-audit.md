# Asset Audit — ResQAI

Generated: 2026-06-28
Mode: Read-Only Audit

---

## Asset Inventory

### Images
No image files found in the repository (no .png, .jpg, .svg, .gif, .ico, .webp files).

### Logos
No logo files found.

### Icons
No icon files found. The apps rely on text-based UI with CSS variables (SVG not used).

### Fonts
No font files found. The apps use system fonts via CSS:
- `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif` (appointment-board)
- `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` (crm-tracker)

### Screenshots
No screenshot files found.

### Videos
No video files found.

### Demo Assets
No demo assets found.

---

## Asset Locations

No dedicated assets directory exists (`infrastructure/` is empty). There is no `public/` or `assets/` folder in any app.

---

## Duplicate Assets

No duplicates found (no assets exist to duplicate).

---

## Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| No app icons/favicons | LOW | All apps have `<title>` but no favicon in `<head>` |
| No logo | LOW | Apps display "ResQAI" as text |
| No public/ directories | LOW | Each app uses root-level serving via Vite |
| Font references in CSS not loaded | LOW | "Plus Jakarta Sans" is referenced but not imported (no `@import` or `<link>` in HTML) |

---

## Recommendations

1. **Add favicon** to each app's `index.html`
2. **Consider adding a logo** for branding
3. **Import "Plus Jakarta Sans"** font if it's intended to be used (add `<link>` in index.html)
4. **Create a shared `public/` or `assets/` directory** if brand assets are needed in the future
