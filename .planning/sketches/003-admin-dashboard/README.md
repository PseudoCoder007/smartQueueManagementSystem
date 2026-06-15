---
sketch: "003"
name: admin-dashboard
question: "How should KPIs and real-time queue status coexist?"
winner: null
tags: [dashboard, admin, metrics, live, services, kpi]
---

# Sketch 003: Admin Dashboard

## Design Question
The admin dashboard needs to show both aggregated KPIs (total tokens, avg wait, completion rate)
AND live per-queue state simultaneously. How should these two types of data be organized?

## How to View
Open `.planning/sketches/003-admin-dashboard/index.html` in a browser and toggle variants.

## Variants
- **A: Cards Grid** — 4-column KPI row at the top, 3-column service card grid below, recent activity table. Classic SaaS admin pattern. Easy to scan, familiar to most admins.
- **B: Split View** — Left panel: per-queue live status with per-service 4-stat grid (waiting/serving/done/avg). Right panel: today's summary numbers + quick actions + hourly bar chart. Best when the admin primarily monitors active queues.
- **C: Command Style** — Near-black (#09090b) background, top-nav tabs instead of sidebar, monospace numbers everywhere, service data in a dense table. Zero decorative chrome — feels like an internal ops tool or Vercel dashboard.

## What to Look For
1. **Information priority** — Do you want aggregated KPIs or per-queue live status to lead? A puts KPIs first; B puts live queues first.
2. **Sidebar vs top-nav** — A/B use a dark sidebar (Linear-style); C uses a top tab bar (Vercel-style). Which fits daily admin workflow better?
3. **Data density** — C shows 6 stats in a row, 4 per service in a compact table. Is this clearer or overwhelming compared to A/B card layouts?
4. **Priority badges** — A shows them inline on service cards; B shows them in the queue expansion row. Where should emergency/VIP tokens surface on the dashboard?
5. **Quick actions placement** — B puts Close All Queues / Open New Queue in a right panel. C puts an action button per row. A has a top-bar button. Which is fastest under pressure?
