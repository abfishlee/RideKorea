# RideKorea V3 Design System

## Goal

RideKorea V3 adopts a Neo-Outdoors direction: a riding screen that feels like a precise sports device, and story screens that feel like a warm travel magazine. The upgrade must preserve current feature behavior. Design changes should be applied through shared visual tokens and screen-level styling only unless a functional change is explicitly approved.

## Principles

- Keep ride-critical information readable at a glance.
- Use energy on the map and live ride HUD, not everywhere.
- Make diary and shared-route surfaces more photographic and editorial.
- Avoid large behavior changes while redesigning visual surfaces.
- Prefer small reusable tokens over one-off color and spacing values.

## Visual Identity

### Colors

- Electric Cyan `#22F3FF`: primary route, live riding accent, active tab accent.
- Deep Cyan `#0891B2`: pressed/secondary active state.
- Adventure Pink `#FF3EA5`: off-route track, personal detour, user-created route moment.
- Sunset Amber `#F59E0B`: voucher, reward, evening travel mood.
- Rose Glow `#FB7185`: sunset emphasis and warm story highlights.
- Ink `#0B1220`: primary text and dark HUD surfaces.
- Slate `#475569`: secondary text.
- Paper `#F8FAFC`: app background.
- Warm Paper `#FFF8ED`: editorial diary background.
- Glass Border `rgba(255,255,255,0.34)`: translucent HUD border.
- Glass Surface `rgba(15,23,42,0.72)`: dark map HUD surface.

### Typography

- Sport numbers: `900` weight, large size, slight italic where supported.
- Screen titles: strong but compact, no oversized landing-page treatment inside app tabs.
- Editorial titles: larger line-height and more whitespace, paired with real photos.
- Body copy: short, functional, and multilingual-safe.

### Shape

- Primary cards: `8px` radius for utility surfaces.
- Map HUD and floating controls: `12px` radius with translucent/glass styling.
- Polaroid photo markers: square photo area with white frame and slight rotation.
- Avoid nested cards unless the inner card is an actual repeated item.

## Screen Direction

### Journey

Priority: highest.

- Convert the live ride panel into a compact glass HUD.
- Use Electric Cyan for expected route and Adventure Pink for off-route/detour.
- Keep start/pause/stop controls large and stable.
- Introduce Polaroid-style photo spot markers visually, without changing diary creation logic.

### Moments

Priority: high.

- Make shared routes feel like travel story cards.
- Lead with photo, route title, rider, and one memorable stop.
- Reduce dashboard-like grid density where possible.
- Keep import/open behavior unchanged.

### Shared Route Detail

Priority: high.

- Use an editorial timeline layout with larger photos.
- Preserve comments, likes, share count, and import behavior.
- Make timeline stops look like travel notes, not admin records.

### My Path

Priority: medium.

- Treat this as a personal route library.
- Use calmer surfaces and clearer grouping for drafts versus completed journeys.
- Avoid heavy neon here except for route provenance badges.

### Compass/Admin

Priority: low.

- Keep operational and restrained.
- Apply token consistency only.
- Do not make admin tools look like marketing/editorial screens.

## Implementation Plan

### Phase 1: Foundation

- [x] Add V3 design system document.
- [x] Add shared Neo-Outdoors design tokens.
- [x] Connect tab bar colors to shared tokens.
- [x] Add low-risk shared style helpers for glass HUD, editorial cards, and route badges.

### Phase 2: Journey Visual Refresh

- [x] Apply sports HUD styling to live ride status.
- [x] Update route/off-route colors to Electric Cyan and Adventure Pink.
- [x] Add Polaroid-style diary spot marker component styling.
- [x] Verify ride controls remain stable on mobile and web.

### Phase 3: Moments Editorial Refresh

- [x] Refresh shared route cards with stronger photography and story hierarchy.
- [x] Refresh diary cards with magazine-like spacing and photo emphasis.
- [x] Keep import/open/comment/share flows unchanged.

### Phase 4: Detail Screens

- [x] Refresh shared route detail timeline.
- [x] Refresh journey detail public diary and imported route panels.
- [x] Keep all API calls and navigation unchanged.

### Phase 5: Polish

- [ ] Run visual QA across Journey, Moments, My Path, Compass.
- [ ] Add a design QA checklist for color contrast, text fit, and mobile spacing.
- [ ] Decide whether to keep or simplify high-energy neon accents after real-device review.

## Change Guardrails

- Do not alter API contracts during design phases.
- Do not change route import, diary creation, ride tracking, login, voucher redemption, or admin mutation behavior.
- Do not add new map provider dependencies during visual refresh.
- Do not use decorative gradients or effects on dense admin workflows.
- Any motion or glow effect must be optional and should not hide map or ride data.

## Flow Preservation Audit

### Moments Editorial Refresh

- Shared route card open flow remains callback-based through `onOpen(route)`.
- Shared route import flow remains callback-based through `onImport(route)`.
- Import button still stops card press propagation before importing.
- Public diary map open flow remains routed by `publicDiaryId`.
- Recent Phase 3 visual changes did not add or remove API calls.

### Detail Screens Refresh

- Shared route detail still loads through `getPublishedSharedRoute` with public fallback through `getPublicSharedRoute`.
- Shared route detail still preserves comments, likes, shares, visibility updates, and route import API calls.
- Shared route import still navigates to `/journeys/{journey.id}` after `importPublicSharedRoute`.
- Journey detail still loads journey data and track points through `getJourney` and `getJourneyTrackPoints`.
- Imported source route preview still loads through `getPublicSharedRoute`.
- Journey publishing still uses `publishJourneyAsSharedRoute` and navigates to `/shared-routes/{route.id}`.
- Diary visibility updates still use `updateSpotDiaryVisibility`.
- Back navigation remains `router.back()` on both detail screens.
