# RideKorea Web Preview and Dev Login

Updated: 2026-07-02

## What Changed

- Fixed the web preview auth restore crash caused by `expo-secure-store` on static web builds.
- Native builds still use `expo-secure-store`.
- Web builds now store the auth token in `localStorage`.
- Added a small underlined `dev_로그인` button under the Google login button.
- Added `POST /api/v1/auth/dev-login` for local-development authentication.

## Dev Login Behavior

- The endpoint creates or reuses a stable development user:
  - Email: `dev@ridekorea.dev`
  - Display name: `Dev Rider`
  - Provider: `dev`
- The frontend receives a normal JWT and stores it through the existing auth session flow.
- This means authenticated app features can be tested without Google or Apple OAuth.
- When the development user has no journeys yet, the backend creates one preview journey with GPS track points and one diary entry so `My Path` has real cards to render.

## Safety

- `dev-login` is enabled by default only outside production.
- If `ENVIRONMENT=production`, the endpoint is blocked.
- To explicitly disable it in local or staging, set:

```env
ALLOW_DEV_LOGIN=false
```

## Local Check Flow

1. Start the backend on `http://127.0.0.1:8000`.
2. Start or refresh the web preview on `http://localhost:8081`.
3. On the login screen, press `dev_로그인`.
4. The app should enter the main RideKorea map screen without Google OAuth.
5. Open `My Path`; a `Dev Preview: Geumgang riverside ride` record should appear for visual QA.
