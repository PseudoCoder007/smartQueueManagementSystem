---
sketch: "004"
name: queue-management
question: "How does the operator manage a live queue efficiently under pressure?"
winner: null
tags: [queue, admin, real-time, operator, call-next, priority]
---

# Sketch 004: Queue Management

## Design Question
The queue management page is the highest-pressure screen in the app — operators use it in real-time,
often under time pressure with patients waiting. The design must support fast decision-making
without cognitive overload.

## How to View
Open `.planning/sketches/004-queue-management/index.html` in a browser and toggle variants.

## Variants
- **A: Three Columns** — Kanban-style: Waiting / Serving / Done side by side. Immediately shows state transitions. Complete/Skip/Cancel actions inline with each token card. Color-coded left border by priority.
- **B: Focus View** — Serving tokens large and prominent at top; compact waiting list row below. Stats sidebar on right with priority alerts. Best when the operator needs to focus on one active token at a time.
- **C: Command Bar** — Dark background, monospace throughout, keyboard shortcuts labeled on every action. Dense table-style layout, no decorative chrome. Feels like a terminal — for operators who prefer speed over aesthetics.

## What to Look For
1. **Call Next placement** — A has it top-right; B has it top-right; C makes it the primary toolbar button with `[space]` shortcut. Which is fastest to reach under pressure?
2. **Priority visibility** — A uses colored left borders + badge. B uses badges in the waiting row. C uses colored row borders. Which makes EMERGENCY tokens impossible to miss?
3. **Kanban vs vertical** — A requires horizontal scanning; B/C scroll vertically. Given 30+ tokens in queue, which scales better?
4. **Action placement** — A puts actions on each card. B puts Complete/Skip on the serving card only. C shows inline row actions. Which is fastest for complete → call next → repeat?
5. **Stats visibility** — A has no stats (just column counts). B has a right panel. C has a top strip. Which level of stat detail is right for the operator during live queue operation?
6. **Keyboard vs mouse** — C explicitly shows `[space]`, `[c]`, `[s]`, `[q]`. Does your target operator want keyboard shortcuts or are they tablet/touch users?
