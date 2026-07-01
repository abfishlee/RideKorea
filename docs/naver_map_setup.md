# Naver Map Setup

Updated: 2026-07-02

RideKorea now renders the map surface on web through the same map HTML bridge used by mobile WebView. Naver Map support is wired, but it requires a Naver Cloud Platform Web Dynamic Map client ID.

## What Is Already Implemented

- `frontend/assets/naver-map.html` loads the Naver Maps JavaScript SDK.
- `frontend/src/config/env.ts` builds `/map?provider=naver&clientId=...` when `EXPO_PUBLIC_MAP_PROVIDER=naver` and `EXPO_PUBLIC_NAVER_CLIENT_ID` are set.
- `backend/app/main.py` serves `naver-map.html` from `/map?provider=naver`.
- `MapPanel` now renders the map in the browser via an iframe instead of a placeholder.
- The iframe and native WebView both use the same `postMessage` bridge contract.

## What You Need To Do

1. In Naver Cloud Platform, create or open an application with Maps > Web Dynamic Map enabled.
2. Add local development domains to the application settings:

```text
http://localhost:8081
http://127.0.0.1:8000
http://localhost:8000
```

3. Add production domains later before deployment.
4. Put the issued client ID in `frontend/.env`:

```env
EXPO_PUBLIC_MAP_PROVIDER=naver
EXPO_PUBLIC_NAVER_CLIENT_ID=YOUR_NAVER_CLIENT_ID
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

5. Rebuild or restart the frontend web preview so Expo embeds the new environment values.

## Quick Local Check

After setting the client ID, this URL should load Naver SDK script references:

```text
http://127.0.0.1:8000/map?provider=naver&clientId=YOUR_NAVER_CLIENT_ID
```

Then refresh:

```text
http://localhost:8081/
```

If the Naver console domain is not registered correctly, the map script may load but the map tiles can remain blank or report a Naver SDK domain/auth error in the browser console.
