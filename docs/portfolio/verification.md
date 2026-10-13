# Portfolio verification — 13 October 2026

## Executed checks

- Backend: `python -m pytest tests -q` from `server/` completed with **56 passed and 19 subtests passed**. Tests use isolated databases/test doubles; this is not a live MySQL or external-provider acceptance test. The run emitted 153 deprecation warnings.
- Public frontend: installed the lockfile dependencies and started the actual Next.js development server. The home route rendered its empty-content state without a connected API. `/login` redirected to the SSO API and returned an error because that API/provider was not running. Successful sign-in is **not** claimed.
- Admin frontend: installed lockfile dependencies, completed `npm run build`, and opened the actual Vite app in Chrome. Its login form rendered and was captured in `local-admin-login.png`. The build warned about circular vendor chunks and bundle size; these warnings remain. No credentials were submitted.
- The financial and document crawler screenshots belong to separate repositories and have their own offline sample verification.

## Presentation boundaries

The existing images under `docs/screenshots/` are repository reference screenshots, not captures of this verification session. The application UI is primarily Chinese. The English README and portfolio explain its business workflows; they do not indicate that the whole application was translated.

External SSO, SMS, payments and trusted-data-space integrations were not exercised. Docker/MySQL deployment, production readiness and a complete user-to-admin journey were not validated during this portfolio update.
