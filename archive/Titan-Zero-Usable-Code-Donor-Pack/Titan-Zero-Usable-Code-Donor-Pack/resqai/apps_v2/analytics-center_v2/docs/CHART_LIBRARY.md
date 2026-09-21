# Chart Library

## Overview

All charts are custom inline SVG components. No external charting library (Chart.js, Recharts, D3) is used. Each chart component handles Loading, Error, Empty states and renders within a shared `Card` container.

## Chart Components

### Line Chart (Time Series)

**Component:** `TimeSeriesChart`
**File:** `src/components/TimeSeriesChart.tsx`
**Data Shape:** `TimeSeriesDataPointVM[]`
**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `TimeSeriesDataPointVM[]` | required | Data points with date and value |
| `title` | `string` | optional | Chart title |
| `height` | `number` | 200 | SVG viewport height |
| `loading` | `boolean` | false | Loading skeleton state |
| `error` | `string \| null` | null | Error message display |
| `emptyMessage` | `string` | optional | Custom empty state message |

**States:** Loading (skeleton bar), Error (red text), Empty (gray message), Data (SVG polyline + circles)

### Bar Chart

**Component:** `BarChart`
**File:** `src/components/BarChart.tsx`
**Data Shape:** `BarChartDataVM[]`
**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `BarChartDataVM[]` | required | Bars with label, value, color |
| `title` | `string` | optional | Chart title |
| `height` | `number` | 200 | Container height |
| `loading` | `boolean` | false | Loading skeleton |
| `error` | `string \| null` | null | Error display |
| `emptyMessage` | `string` | optional | Empty state message |

**States:** Loading, Error, Empty, Data (flex-based bar rendering)

### Pie Chart

**Component:** `PieChart`
**File:** `src/components/PieChart.tsx`
**Data Shape:** `PieChartSliceVM[]`
**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `PieChartSliceVM[]` | required | Slices with label, value, percentage, color |
| `title` | `string` | optional | Chart title |
| `size` | `number` | 180 | SVG diameter |
| `loading` | `boolean` | false | Loading skeleton |
| `error` | `string \| null` | null | Error display |
| `emptyMessage` | `string` | optional | Empty state message |

**States:** Loading (circle skeleton), Error, Empty, Data (SVG path arcs + center hole + legend)

### Area Chart

**Component:** `AreaChart`
**File:** `src/components/AreaChart.tsx`
**Data Shape:** `TimeSeriesDataPointVM[]`
**States:** Loading, Error, Empty, Data (SVG filled path with gradient)

### Heat Map

**Component:** `HeatMap`
**File:** `src/components/HeatMap.tsx`
**Data Shape:** `HeatMapDataVM[]`
**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `HeatMapCellVM[]` | required | Cells with row, column, value, color |
| `xLabels` | `string[]` | required | Column headers |
| `yLabels` | `string[]` | required | Row headers |
| `title` | `string` | optional | Chart title |
| `loading` | `boolean` | false | Loading state |
| `error` | `string \| null` | null | Error state |

### Trend Graph

**Component:** `TrendGraph`
**File:** `src/components/TrendGraph.tsx`
**Data Shape:** `TrendGraphDataVM`
**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `TrendGraphDataVM` | required | Multi-line data with comparison |
| `title` | `string` | optional | Chart title |
| `showComparison` | `boolean` | false | Show previous period overlay |
| `loading` | `boolean` | false | Loading state |
| `error` | `string \| null` | null | Error state |

### MetricCard (KPI Card)

**Component:** `MetricCard`
**File:** `src/components/MetricCard.tsx`
**Data Shape:** `KpiCardVM`
**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `metric` | `KpiCardVM` | required | KPI value, label, trend |
| `loading` | `boolean` | false | Skeleton state |
| `onClick` | `() => void` | optional | Drill-down handler |

**States:** Loading (skeleton), Data (label, value, trend arrow, progress bar)

### KpiDashboardGrid

**Component:** `KpiDashboardGrid`
**File:** `src/components/KpiDashboardGrid.tsx`
**Data Shape:** `KpiCardVM[]`
**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `metrics` | `KpiCardVM[]` | required | Array of KPI cards |
| `loading` | `boolean` | false | Loading grid skeleton |
| `error` | `string \| null` | null | Error state |
| `onMetricClick` | `(id) => void` | optional | Drill-down handler |
| `columns` | `number` | 4 | Grid column count |

### Leaderboard

**Component:** `Leaderboard`
**File:** `src/components/Leaderboard.tsx`
**Data Shape:** `LeaderboardEntryVM[]`
**States:** Loading, Error, Empty, Data (ranked list with badges)

### Live KPI Cards

**Component:** `LiveKPICards`
**File:** `src/components/LiveKPICards.tsx`
**Data Shape:** `KpiCardVM[]` with auto-refresh
**States:** Loading, Error, Empty, Data (animated KPI cards with refresh indicator)

## Data View Models

```typescript
interface TimeSeriesDataPointVM {
  date: string;
  value: number;
  secondaryValue?: number;
  label?: string;
}

interface BarChartDataVM {
  label: string;
  value: number;
  secondaryValue?: number;
  color?: string;
}

interface PieChartSliceVM {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

interface HeatMapCellVM {
  row: string;
  column: string;
  value: number;
  color: string;
}

interface TrendGraphDataVM {
  primary: TimeSeriesDataPointVM[];
  comparison?: TimeSeriesDataPointVM[];
}

interface LeaderboardEntryVM {
  rank: number;
  name: string;
  value: number;
  change: number;
  avatar?: string;
  trend: 'up' | 'down' | 'flat';
}
```

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#41d1c4` | Line strokes, bar fills, positive trends |
| `secondary` | `#7c3aed` | Secondary lines, comparison data |
| `accent` | `#f59e0b` | Highlight, warnings |
| `danger` | `#ef4444` | Negative trends, SLA breaches |
| `success` | `#22c55e` | Positive trends, compliance |
| `neutral-1` | `#e6ecf5` | Text, labels |
| `neutral-2` | `#8b9bb5` | Secondary text |
| `neutral-3` | `#6b7a95` | Muted text |
| `neutral-4` | `#243049` | Borders, skeletons |
| `neutral-5` | `#1a2540` | Chart background |
| `bg-card` | `#131c2f` | Card background |
| `bg-page` | `#0b1220` | Page background |

## Chart Styles

- Consistent card border: `1px solid #243049`
- Card background: `#131c2f`
- Chart background: `#1a2540`
- Font family: system UI stack
- All transitions: `0.3s ease`
- Border radius: `6px` (cards), `3px` (bars)
