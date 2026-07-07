# save-life

Single-server Docker Compose deployment for the `save-life` project.

## Project layout

- `front-save-life/` — Refine + React frontend (served on port 80)
- `backend-save-life/` — iii engine + HTTP API (ports 3111, 49134, 3112, 9464)
- `backend-save-life/workers/math-worker/` — Python worker
- `backend-save-life/workers/caller-worker/` — TypeScript worker

## Quick start (local)

```bash
cp .env.example .env
# edit .env if needed, then:
docker-compose up --build -d
```

- Frontend: http://localhost
- iii HTTP API: http://localhost:3111
- iii WebSocket: ws://localhost:49134

## Deploy to a server

1. On the server, clone the repo and enter the directory.
2. Copy `.env.example` to `.env` and set at least `VITE_API_URL` to the public backend URL.
3. Log in to the Aliyun registry (used by GitHub Actions):

   ```bash
   docker login --username=tb2395355_2012 registry.cn-hangzhou.aliyuncs.com
   ```

4. Pull the images built by the GitHub Action and start everything:

   ```bash
   docker-compose pull
   docker-compose up -d
   ```

## GitHub Actions

The workflow `.github/workflows/docker-push.yml` builds and pushes all images to `registry.cn-hangzhou.aliyuncs.com/u-rep/`.

Required repository secret:

- `ALIYUN_REGISTRY_PASSWORD` — Aliyun Container Registry login password

Optional repository variables:

- `VITE_API_URL` — public API URL used when building the frontend image (defaults to the fake Refine API)
- `DEPLOY_HOST` — if set, the workflow will also SSH into the server and run `docker-compose pull && docker-compose up -d`
- `DEPLOY_USER` — SSH username for the deploy step

Optional repository secrets for auto-deploy:

- `DEPLOY_SSH_KEY` — SSH private key for the deploy step

## Notes

- The frontend now reads `VITE_API_URL` at build time. To connect it to the iii backend, set `VITE_API_URL=http://your-server-ip:3111` before building.
- The backend HTTP host is bound to `0.0.0.0` inside the container so it can be reached from outside.
- Workers connect to the engine using the internal Compose hostname `backend` on port `49134`.
