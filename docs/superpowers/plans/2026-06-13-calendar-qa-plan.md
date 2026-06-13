# Calendar View — QA & Build Plan

**Branch:** `qa/calendar-view`
**Goal:** Verify the calendar view builds cleanly, type-checks, and passes Playwright E2E tests.

---

## Checklist

### 1. TypeScript type-check
- Run `npx tsc --noEmit` in `app/`
- Expect: 0 errors (all existing errors resolved)

### 2. Build
- Run `npm run build` in `app/`
- Expect: clean build, exit 0

### 3. Playwright setup
- Install `@playwright/test`
- Install `chromium` browser
- Create config `playwright.config.ts`
- Create test directory `tests/`

### 4. E2E Tests (Playwright)
Tests cover:
- **T01** Login screen renders and "Create workspace" works
- **T02** Calendar nav renders with Day/Week/Month toggle and Today button
- **T03** Day view shows time grid with hour lines
- **T04** Week view shows 7 day columns
- **T05** Month view shows calendar grid with current month dates
- **T06** Calendar page is accessible from sidebar
- **T07** Create entry popover appears on blank slot click (basic existence)
- **T08** Running timer renders as entry block (basic existence)

### 5. Browser screenshot verification
- Take screenshots of each view (Day, Week, Month) for visual review

---

## Execution

Run sequentially. Fix any failure before moving on.
