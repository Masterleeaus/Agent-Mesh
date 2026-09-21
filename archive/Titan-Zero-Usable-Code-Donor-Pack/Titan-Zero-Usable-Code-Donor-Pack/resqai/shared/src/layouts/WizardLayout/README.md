# WizardLayout

Multi-step form wizard with step progress indicator.

## Zones

| Slot       | Description                         |
|------------|-------------------------------------|
| `header`   | Top bar (optional)                  |
| `children` | Current step form content           |
| `footer`   | Bottom action bar (optional)        |

## Props

- `steps` — array of `WizardStep` objects (`id`, `label`, `description`)
- `currentStep` — zero-based index of active step
- `onStepClick` — callback when a completed/active step is clicked
- `orientation` — `'horizontal'` (default) or `'vertical'`

## Behavior

- Step indicator shows numbers for incomplete, checkmarks for complete
- Completed steps (idx < currentStep) are clickable
- Future steps (idx > currentStep) are disabled
- Active step is highlighted with accent color
