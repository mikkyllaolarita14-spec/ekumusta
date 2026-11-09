# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Backend configuration

The API base URL is resolved in `src/api/axios.js`:

| Build | Default backend |
| --- | --- |
| `npm run dev` | `http://127.0.0.1:8000/api` |
| `npm run build` | `https://unlovely-badge-kiln.ngrok-free.dev/api` |

Override it without touching code by setting `VITE_API_BASE_URL` in a local `.env`
file (see `.env.example`) or in **Repository → Settings → Secrets and variables →
Actions → Variables** for the deployed build. Requests send
`ngrok-skip-browser-warning: true` so ngrok's free-tier warning page never
replaces an API response.

The backend must allow the deployed origin in its CORS configuration, e.g.
`https://<your-username>.github.io` (no path, no trailing slash). With Laravel
Sanctum, add it to the stateful/`allowed_origins` list and clear the config cache
afterwards.

## Deploying to GitHub Pages

1. Push the project to a GitHub repository (branch `main`).
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Every push to `main` triggers `.github/workflows/deploy.yml`, which builds the
   app and publishes `dist/` to `https://<username>.github.io/<repo>/`.

Routing uses `HashRouter`, so deep links like `/#/admin/dashboard` work on GitHub
Pages without a server-side rewrite rule. The workflow derives the Vite `base`
path from the repository name, so no manual edit is required. If you later move
to a custom domain or a `<username>.github.io` repository, the base path becomes
`/` automatically.

An ngrok free-tier URL changes whenever the tunnel restarts; update
`PROD_API_URL` in `src/api/axios.js` (or the `VITE_API_BASE_URL` variable, which
wins) and re-run the workflow when that happens.
