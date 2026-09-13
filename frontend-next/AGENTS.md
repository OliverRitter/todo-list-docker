# Project Guidance

This is the frontend for the spatial task application. Keep UI behavior in `src/components`, page composition and auth gating in `src/app/page.tsx`, and shared live task state in `src/store/useSpatialStore.ts`. Keep persistence, auth middleware, and socket validation in `backend/`.

## Size and Responsive Layout

- Preserve the map container's explicit `400px` height in both loading and mounted states; Leaflet needs a stable parent size. Call `invalidateSize()` after layout changes.
- Check layouts below and above the `lg` breakpoint when changing `src/app/page.tsx` or `src/components/TaskForm.tsx`. The task form's category/date row is two columns and can become cramped on narrow screens.
- Keep dropdowns and popups bounded with the existing overflow and minimum-width constraints so content does not resize or escape its panel.
- Prefer canonical Tailwind sizing utilities when available, and use the shared `Button` component's size variants for reusable controls instead of ad hoc dimensions.
- Keep Leaflet imports and map rendering client-only; the map is dynamically loaded with SSR disabled.

## Checks

From this directory, run `npm run lint` and `npm run build` after frontend changes. There is currently no automated test script; verify responsive behavior manually at mobile and desktop widths when sizing is involved.

See [README.md](README.md) for the generated Next.js getting-started notes and [../docker-compose.yml](../docker-compose.yml) for the local multi-service setup.
