# Calendar View — Plan

**Date:** 2026-06-13
**Status:** Approved
**Author:** Frank Pfeift (with Claude)

## Goal

Replace the existing list-based timer page (`/timer`) with a full **calendar time tracking view** that feels like Google Calendar / Outlook Calendar. Three views (Day, Week, Month) with drag-and-drop entry creation, moving, resizing, inline editing, and a live running timer displayed as an animated block.

---

## Design Decisions (from brainstorming)

| Decision | Choice |
| --- | --- |
| Views | Day + Week + Month (toggle between them) |
| Creation | Click/drag blank slots → inline form (description + project + billable) |
| Moving | Ghost preview + drag to new time/day, Escape to cancel |
| Resizing | Ghost preview + drag block edges, Escape to cancel |
| Editing | Click existing block → inline edit popover |
| Month detail | Hybrid: few entries = detail lines, many = condensed bars + "N more" |
| Project colors | Left border accent + subtle tinted background on blocks |
| Running timer | Animated block extending to "now" with live timestamp, stoppable from calendar |
| Navigation | "Today" button, ←/→, period title, mini-calendar for quick jump |
| Time axis | 00:00–23:00 on day/week, optional working hours (08:00–20:00) |
| "Now" indicator | Pulsing red line + live clock |
| Location | New page at `/calendar` in the existing Next.js `app/` directory |
| Sidebar nav | New nav item "Calendar" in the existing sidebar (top of "Track" group) |

---

## Architecture

### File structure (in `app/`)

```
app/
  app/(app)/calendar/
    page.tsx                     ← main calendar page (view toggle, header, component)
  components/
    calendar/
      calendar-grid.tsx          ← the main calendar view (delegates to day/week/month)
      day-view.tsx               ← single-day time grid with blocks
      week-view.tsx              ← 7-column time grid with blocks
      month-view.tsx             ← month grid with hybrid detail
      calendar-block.tsx         ← individual time entry block (drag, click, color)
      calendar-nav.tsx           ← Today, ←/→, mini-calendar, view toggle
      create-popover.tsx         ← inline form for creating new entries
      edit-popover.tsx           ← inline form for editing entries
      now-indicator.tsx          ← pulsing "now" line + live clock
      ghost-preview.tsx          ← ghost block that follows cursor during drag
  lib/
    calendar/
      time.ts                    ← calendar-specific time utils (slot calc, etc.)
      drag-drop.ts               ← drag-and-drop hooks and utilities
```

### Key components

1. **`calendar-grid.tsx`** — Orchestrates the active view (Day/Week/Month). Receives `date` (current visible period) and `view` state. Fetches data (entries, projects, running timer) via existing hooks.

2. **`day-view.tsx`** — Renders a single-day grid. Time axis on left (00:00–23:00 or working hours). Horizontal gridlines at each hour. Clickable blank slots for creating entries. Blocks positioned absolutely based on start time.

3. **`week-view.tsx`** — Renders 7 columns (Mon–Sun). Same time axis. Blocks span horizontally based on start/end time within each day column.

4. **`month-view.tsx`** — Renders a 7-column grid of dates. Each day cell shows either:
   - 1–3 entries as compact lines (time + project name + color dot)
   - 4+ entries as condensed horizontal bars + "N more" indicator
   - Click any entry or day cell to navigate to Day view

5. **`calendar-block.tsx`** — The core draggable element. Renders a time entry block with project color (left border + tinted bg). Handles:
   - `mousedown` → start ghost preview + drag state
   - `click` (non-drag) → open inline edit popover
   - Edge resize handles (top/bottom)

6. **`calendar-nav.tsx`** — Navigation bar with:
   - "Today" button
   - ←/→ arrows
   - Period title ("June 15, 2025" / "Jun 15 – 21" / "June 2025")
   - Mini-calendar popup (clickable grid to jump to any date)
   - View toggle (Day / Week / Month buttons)

7. **`create-popover.tsx`** — Inline form that appears at the dropped location. Fields:
   - Description (text input)
   - Project (select dropdown, same as TimerBar)
   - Billable (toggle, default true)
   - Submit / Cancel buttons
   - Auto-focus description on creation

8. **`edit-popover.tsx`** — Inline form at the clicked block's position. Same fields as create, pre-filled with current values. Submit updates the entry.

9. **`ghost-preview.tsx`** — Semi-transparent block that follows the mouse during drag. Shows the projected new start time and duration. Opacity ~0.6, same color styling.

10. **`now-indicator.tsx`** — Horizontal line at current time position, pulsing animation. Live clock display. Only visible in Day/Week views.

11. **Drag-drop utilities** (`lib/calendar/drag-drop.ts`):
    - `useCalendarDragDrop` — custom hook that handles the full drag lifecycle
    - Tracks: start position, current position, element being dragged
    - On drag start: creates ghost, records original position
    - On drag move: updates ghost position, calculates projected time from Y coordinate
    - On drag end: dispatches update mutation if position changed, removes ghost
    - On Escape: cancels drag, restores original position

### Data flow

1. **Data fetching**: Uses existing hooks (`useWorkspace`, `useMyTimesheet`) from `app/lib/hooks.ts`
2. **Mutations**: Uses existing `timesheetApi` from `app/lib/api.ts`
3. **Real-time**: Existing `refetchInterval: 4000` on workspace/timesheets queries handles live updates
4. **Running timer**: The `now` state in the page component updates every second to keep the "now" line and running timer block positioned correctly

### Calendar-specific time utilities (`app/lib/calendar/time.ts`)

- `timeToY(hour: number, minute: number)` → pixel offset from top of grid
- `yToTime(y: number)` → { hour, minute } from pixel offset
- `getWeekRange(date: Date)` → [{ startDate, endDate }] for the week containing `date`
- `getMonthGrid(date: Date)` → array of { date, isCurrentMonth, dayOfWeek } for the month grid
- `snapToSlot(minutes: number, snap: number)` → rounds to nearest 15-min slot
- `formatPeriodTitle(date: Date, view: "day" | "week" | "month")` → human-readable period string

---

## Styling approach

- Use Tailwind classes exclusively (matching the existing app's dark theme)
- Reuse existing `.tt-card`, `.tt-btn`, `.tt-btn-primary` component classes
- Calendar grid lines use `border-ink-600/40`
- Block colors use project color as left border (`border-l-[4px]`) + subtle tint (`bg-{color}/[0.08]`)
- Ghost preview uses `opacity-60` with `backdrop-blur`
- Popovers use existing `.tt-card` styling with absolute positioning
- Pulsing animation extends existing keyframes pattern

---

## Implementation order

1. Calendar time utilities (`lib/calendar/time.ts`)
2. Calendar page shell + nav (`app/(app)/calendar/page.tsx`, `calendar-nav.tsx`)
3. Day view with time grid and "now" indicator (`day-view.tsx`, `now-indicator.tsx`)
4. Calendar block component with project colors (`calendar-block.tsx`)
5. Week view (`week-view.tsx`)
6. Month view with hybrid detail (`month-view.tsx`)
7. Drag-and-drop system (ghost preview + drag-drop hook)
8. Create popover (inline form)
9. Edit popover (inline form)
10. Running timer block integration
11. Sidebar nav update

---

## Testing approach

- Manual testing via `npm run dev` in the app directory
- Verify drag-and-drop works smoothly in all three views
- Verify create/edit/delete mutations propagate correctly
- Verify running timer display updates live
- Verify "now" indicator position updates every second
- Test month view hybrid behavior with various entry counts
