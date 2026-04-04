# Phase 1 Implementation Checklist

## Goal

Land the engineering skeleton for:

- public web app
- admin app
- FastAPI service
- env config
- nginx and docker compose base files

## Done in this phase

- Project directories created
- Frontend source scaffolds created for `web` (`Next.js 15`) and `admin`
- FastAPI app scaffold created
- Basic auth/login and health endpoints created
- SQLAlchemy base models and DB session created
- Dockerfiles and compose scaffold created
- Root `.gitignore` and env examples created

## Still blocked by local environment

- `node` / `npm` not installed locally
- `docker` not installed locally
- Frontend install/build not yet verified on this machine

## Next checks once Node is installed

1. Run `npm install` in `web`
2. Run `npm install` in `admin`
3. Run `npm run dev` in `web` and verify `Next.js` app router pages load
4. Run `npm run dev` in `admin`

## Next checks once Python deps are installed

1. Create venv
2. Install `server/requirements.txt`
3. Run `uvicorn app.main:app --reload`

## Acceptance for phase 1

- folder structure is stable
- backend can start locally
- frontend projects can install and boot
- compose files are ready for later environment verification
