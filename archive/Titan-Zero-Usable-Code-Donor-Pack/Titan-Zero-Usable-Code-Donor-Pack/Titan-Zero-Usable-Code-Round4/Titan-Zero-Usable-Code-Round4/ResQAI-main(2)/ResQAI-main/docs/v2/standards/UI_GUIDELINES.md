# RESQAI V2 — UI Guidelines

> Phase 2.1 — Engineering Standards  
> Chief Software Engineering Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [Design Tokens](#1-design-tokens)
2. [Colors](#2-colors)
3. [Spacing](#3-spacing)
4. [Typography](#4-typography)
5. [Icons](#5-icons)
6. [Buttons](#6-buttons)
7. [Cards](#7-cards)
8. [Tables](#8-tables)
9. [Forms](#9-forms)
10. [Dialogs](#10-dialogs)
11. [Loading States](#11-loading-states)
12. [Empty States](#12-empty-states)
13. [Error States](#13-error-states)
14. [Responsive Behavior](#14-responsive-behavior)
15. [Accessibility](#15-accessibility)
16. [Animation](#16-animation)
17. [Notifications](#17-notifications)

---

## 1. Design Tokens

Design tokens are defined in `packages/resqai-ui/src/styles/tokens.ts` and consumed via Tailwind CSS custom properties.

```
Token                            → Tailwind Variable           → Value
──────────────────────────────────────────────────────────────────────
--resqai-color-primary-500       → primary (500)               #2563EB
--resqai-color-neutral-50        → neutral (50)                #FAFAFA
--resqai-radius-md               → rounded-md                  0.375rem
--resqai-shadow-sm               → shadow-sm                   box-shadow
--resqai-font-sans               → font-sans                   Inter
```

---

## 2. Colors

### 2.1 Primary Palette
```
Token               Usage                    Hex
─────────────────────────────────────────────────
primary-50          Background light         #EFF6FF
primary-100         Hover background         #DBEAFE
primary-200         Selected background      #BFDBFE
primary-400         Active border            #60A5FA
primary-500         Default / CTA            #2563EB
primary-600         Hover                    #1D4ED8
primary-700         Active / Pressed         #1E40AF
primary-800         Text on light bg         #1E3A8A
```

### 2.2 Neutral Palette
```
Token               Usage                    Hex
─────────────────────────────────────────────────
neutral-50          Page background          #FAFAFA
neutral-100         Card background          #F5F5F5
neutral-200         Border / Divider         #E5E5E5
neutral-300         Disabled background      #D4D4D4
neutral-400         Disabled text            #A3A3A3
neutral-500         Placeholder text         #737373
neutral-600         Secondary text           #525252
neutral-700         Body text                #404040
neutral-800         Heading text             #262626
neutral-900         Primary text             #171717
```

### 2.3 Semantic Colors
```
Token               Usage                    Hex
─────────────────────────────────────────────────
success-500         Success                  #16A34A
success-100         Success background       #DCFCE7
warning-500         Warning                  #F59E0B
warning-100         Warning background       #FEF3C7
error-500           Error                    #DC2626
error-100           Error background         #FEE2E2
info-500            Info                     #0EA5E9
info-100            Info background          #E0F2FE
```

### 2.4 Status Colors (Domain-Specific)
```
Status                  Color
─────────────────────────────
ticket_open             #2563EB (primary)
ticket_in_progress      #F59E0B (warning)
ticket_resolved         #16A34A (success)
ticket_closed           #737373 (neutral-500)
technician_available    #16A34A (success)
technician_busy        #F59E0B (warning)
technician_offline     #DC2626 (error)
```

---

## 3. Spacing

Based on 4px grid. Tailwind spacing scale is standard.

```
Token       Value  Usage
───────────────────────────
space-1      4px   Tight icon padding
space-2      8px   Dense content gap
space-3     12px   Label to input gap
space-4     16px   Card padding / button padding
space-5     20px   Section breathing room
space-6     24px   Card gap in grid
space-8     32px   Section padding
space-10    40px   Page section margin
space-12    48px   Between major sections
space-16    64px   Page padding
```

### 3.1 Layout Grid
- 12-column grid system
- Max content width: 1280px
- Sidebar width: 280px (collapsible to 64px)
- Content padding: `px-6 md:px-8 lg:px-10`

---

## 4. Typography

### 4.1 Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
font-family: 'JetBrains Mono', monospace; /* Code */
```

### 4.2 Type Scale
```
Token          Size     Weight   Line Height  Usage
────────────────────────────────────────────────────────
text-xs        0.75rem  400      1rem         Caption, helper
text-sm        0.875rem 400      1.25rem      Body small, metadata
text-base      1rem     400      1.5rem       Body text
text-lg        1.125rem 500      1.75rem      Lead, intro
text-xl        1.25rem  600      1.75rem      Card title
text-2xl       1.5rem   600      2rem         Section heading
text-3xl       1.875rem 600      2.25rem      Page heading
text-4xl       2.25rem  700      2.5rem       Dashboard title
```

### 4.3 Usage Rules
- Page titles: `text-3xl font-semibold`
- Section headers: `text-2xl font-semibold`
- Card titles: `text-xl font-semibold`
- Body text: `text-base`
- Metadata: `text-sm text-neutral-500`
- Labels: `text-sm font-medium`

---

## 5. Icons

### 5.1 Library
- **Heroicons** (outline, 24×24) for navigation and actions
- **Lucide** for specialized icons
- Custom SVG icons in `packages/resqai-ui/src/icons/`

### 5.2 Sizing
```
Token         Size    Usage
────────────────────────────
icon-sm       16px    Inline with text
icon-md       20px    Button icons
icon-lg       24px    Navigation icons
icon-xl       32px    Empty state / page hero
```

### 5.3 Icon Usage Rules
- Icons always have `aria-hidden="true"` unless they are the only content
- Tooltips on icon-only buttons
- Consistent icon for same action across all apps (e.g., edit = pencil, delete = trash)

---

## 6. Buttons

### 6.1 Button Variants
```
Primary   → bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700
Secondary → bg-white text-neutral-700 border hover:bg-neutral-50 active:bg-neutral-100
Ghost     → text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200
Danger    → bg-error-500 text-white hover:bg-error-600 active:bg-error-700
Link      → text-primary-500 hover:underline (inline only)
```

### 6.2 Button Sizes
```
Token      Height   Padding     Font
──────────────────────────────────────
sm         32px     px-3 py-1   text-sm
md         40px     px-4 py-2   text-sm
lg         48px     px-6 py-3   text-base
```

### 6.3 Button Rules
- Every button has `disabled` state (opacity-50, cursor-not-allowed)
- Loading buttons show spinner + hide text
- Icon buttons: `min-w-[40px]`, square, aria-label
- Button groups: first/last rounded corners only

---

## 7. Cards

### 7.1 Card Styles
```css
/* Default card */
.card-default {
  @apply bg-white border border-neutral-200 rounded-lg shadow-sm;
}

/* Elevated card (dashboard widget) */
.card-elevated {
  @apply bg-white border border-neutral-200 rounded-lg shadow-md;
}

/* Bordered card (form sections) */
.card-bordered {
  @apply bg-white border border-neutral-200 rounded-lg;
}

/* Clickable card */
.card-clickable {
  @apply bg-white border border-neutral-200 rounded-lg shadow-sm
         hover:border-primary-200 hover:shadow-md
         transition-all duration-150 cursor-pointer;
}
```

### 7.2 Card Sections
```
┌─────────────────────────────────────┐
│ Card Header                          │  → py-3 px-4 border-b
│   Title (text-xl font-semibold)      │
│   Actions (right-aligned)            │
├─────────────────────────────────────┤
│ Card Body                            │  → p-4
│   Content                            │
├─────────────────────────────────────┤
│ Card Footer                          │  → py-3 px-4 border-t bg-neutral-50
│   Actions                            │
└─────────────────────────────────────┘
```

---

## 8. Tables

### 8.1 Table Styles
```css
/* Base table */
.table-default {
  @apply w-full border-collapse;
}

/* Header */
.table-header {
  @apply bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider;
}

/* Row */
.table-row {
  @apply border-b border-neutral-100 hover:bg-neutral-50 transition-colors;
}

/* Cell */
.table-cell {
  @apply px-4 py-3 text-sm text-neutral-700 whitespace-nowrap;
}
```

### 8.2 Table Rules
- Sticky header on scroll
- Sort indicators on sortable columns
- Row hover highlight
- Selected row: `bg-primary-50`
- Empty table: render `<EmptyState />` component
- Loading: render `<Skeleton />` rows
- Pagination below table
- Max 25 rows per page default

---

## 9. Forms

### 9.1 Input Styles
```css
.input-default {
  @apply w-full px-3 py-2 text-sm border border-neutral-300 rounded-md
         placeholder:text-neutral-400
         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
         disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed;
}

.input-error {
  @apply border-error-500 focus:ring-error-500 focus:border-error-500;
}
```

### 9.2 Form Layout
```
┌─────────────────────────────────────┐
│ Label (text-sm font-medium)          │
│ [ Input / Select / Textarea ]        │  → mt-1
│ Helper text (text-xs text-neutral)   │  → mt-1 (optional)
│ Error text (text-xs text-error)      │  → mt-1 (when error)
└─────────────────────────────────────┘
```

### 9.3 Form Rules
- Labels always visible (no placeholder-as-label)
- Required fields marked with `*`
- Error messages appear below field, not as tooltip
- Submit button disabled until form valid
- Auto-save on blur for inline forms
- Confirmation dialog on discard with unsaved changes

---

## 10. Dialogs

### 10.1 Dialog Variants
```
Default   → Standard modal for forms/details
Confirm   → Confirmation with cancel/confirm buttons
Alert     → Informational, single dismiss button
Fullscreen → Complex workflows (wizard)
Slideover → Side panel for quick actions
```

### 10.2 Dialog Structure
```
┌─────────────────────────────────────┐
│ Title (text-lg font-semibold)        │
│ Description (text-sm text-neutral)   │
├─────────────────────────────────────┤
│ Content                               │
│                                       │
├─────────────────────────────────────┤
│ [Cancel] [Confirm] (right-aligned)   │
└─────────────────────────────────────┘
```

### 10.3 Dialog Rules
- Close on Escape key
- Close on backdrop click (except critical confirmations)
- Focus trap inside dialog
- First focusable element auto-focused
- Scrollable body if content exceeds viewport

---

## 11. Loading States

### 11.1 Loading Patterns
```
Pattern           Usage
───────────────────────────────────────
Skeleton          Content areas (table rows, card content, chart placeholders)
Spinner           Button loading, full-page loading
Progress bar      Multi-step operations, file upload
Shimmer           Image placeholders
Overlay spinner   Form submission (disabled form + spinner overlay)
```

### 11.2 Skeleton Rules
- Match skeleton shape to content shape (rect for text, circle for avatar)
- Use `animate-pulse` for skeleton animation
- Always render matching number of skeleton rows (e.g., 10 rows for table)
- Transition from skeleton → content smoothly (no flicker)

---

## 12. Empty States

### 12.1 Empty State Structure
```
┌─────────────────────────────────────┐
│                                     │
│          [Illustration / Icon]       │  → 64px, text-neutral-300
│                                     │
│    Title (text-lg font-semibold)     │
│                                     │
│    Description (text-sm text-neutral) │
│                                     │
│         [Action Button]              │  → Primary CTA
│                                     │
└─────────────────────────────────────┘
```

### 12.2 Empty State Text Patterns
- List empty: "No {items} yet. Create your first {item} to get started."
- Search empty: "No {items} match your search. Try different keywords."
- Filter empty: "No {items} match the current filters. Clear filters to see all."

---

## 13. Error States

### 13.1 Error State Structure
```
┌─────────────────────────────────────┐
│                                     │
│          [Warning Icon]              │  → 64px, text-error-400
│                                     │
│    Title (text-lg font-semibold)     │
│         "Something went wrong"      │
│                                     │
│    Description (text-sm text-neutral) │
│    "We couldn't load tickets.        │
│     Please try again."              │
│                                     │
│         [Retry Button]               │  → Secondary with refresh icon
│                                     │
└─────────────────────────────────────┘
```

### 13.2 Error Recovery
- Every error state has a retry action
- Network errors: auto-retry 3× with exponential backoff, then show error
- Permission errors: navigate to appropriate view or contact admin
- Timeout errors: suggest reducing scope or retrying

---

## 14. Responsive Behavior

### 14.1 Breakpoints
```
Token      Width         Layout
───────────────────────────────────
mobile     < 640px       Single column, bottom nav
tablet     640-1023px    Two column, collapsible sidebar
desktop    1024-1279px   Full layout, sidebar visible
wide       >= 1280px     Max content width 1280px, centered
```

### 14.2 Responsive Rules
- All pages functional at 375px minimum
- Tables horizontal scroll on mobile (sticky first column)
- Sidebar collapses to icon-only on tablet
- Navigation: top bar on mobile → sidebar on desktop
- Dialogs: full-screen on mobile → centered on desktop
- Cards: 1-col mobile → 2-col tablet → 3-col desktop

---

## 15. Accessibility

### 15.1 WCAG 2.1 AA Compliance
All apps must meet WCAG 2.1 Level AA. Key requirements:

| Requirement | Standard | How |
|-------------|----------|-----|
| Color contrast | 4.5:1 normal text, 3:1 large text | Use palette tokens, check with axe |
| Keyboard navigation | All functions keyboard accessible | Tab order, focus indicators |
| Screen reader | All content readable | ARIA labels, roles, live regions |
| Focus indicators | Visible focus ring | `focus:ring-2 focus:ring-primary-500` |
| Heading hierarchy | One h1 per page, sequential h2-h6 | Semantic HTML |
| Alt text | All images have alt | Meaningful description or `alt=""` |

### 15.2 Accessibility Checklist
- [ ] All interactive elements keyboard accessible
- [ ] All form inputs have associated labels
- [ ] Error messages linked to inputs via `aria-describedby`
- [ ] Dynamic content changes announced via `aria-live`
- [ ] Color not the only indicator of state
- [ ] Skip-to-content link visible on focus
- [ ] Focus order matches visual order
- [ ] Touch targets at least 44×44px

---

## 16. Animation

### 16.1 Duration
```
Token         Duration    Usage
─────────────────────────────────
fast          150ms       Hover, focus, click feedback
normal        200ms       Transitions, show/hide
slow          300ms       Page transitions, dialog open
```

### 16.2 Animation Rules
- Prefer CSS transitions over JavaScript animation
- Reduce motion: respect `prefers-reduced-motion`
- No infinite animations (spinner exception)
- Page transitions: fade + subtle slide (100px, 200ms)

---

## 17. Notifications

### 17.1 Toast Notifications
```
Position: top-right, stacking
Width: 400px max
Dismiss: auto-dismiss after 5s (success/info), manual dismiss (error/warning)

Variants:
  Success → bg-success-100 border-success-500 text-success-800
  Error   → bg-error-100 border-error-500 text-error-800
  Warning → bg-warning-100 border-warning-500 text-warning-800
  Info    → bg-info-100 border-info-500 text-info-800
```

### 17.2 In-App Banner
```
Position: top of page, below header
Width: 100% within content area
Dismiss: close button
Priority stacking: most recent at top
```

---

> **End of UI_GUIDELINES.md**
