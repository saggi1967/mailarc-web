# mailarc-web

React-Frontend (Material UI) für das **mailarc**-Archiv. Spricht ausschließlich die
**client-API** des [`mailarc-server`](https://github.com/saggi1967/mailarc-server)
(`/api`, Session-Cookie-Auth) — Elasticsearch und die DB bleiben serverseitig.

> Der IMAP-Import (`sync`) bleibt außerhalb des UI (CLI/Cron). Das Frontend ist
> **lesend + verwaltend**: Suche, Mail-Ansicht, PDF, Anhänge, (später) Statistik &
> Kontenverwaltung.

## Stack

Vite · React + TypeScript · Material UI (MUI v6) + MUI X DataGrid · TanStack Query · React Router.

## Entwicklung

```bash
cp .env.example .env          # VITE_API_BASE auf den Server zeigen (z. B. http://localhost:9000)
npm install
npm run dev                   # http://localhost:5173
```

Der Server muss `http://localhost:5173` in **`WEB_ORIGINS`** erlauben und einen
Web-Login gesetzt haben:

```bash
# in der .env des mailarc-servers
WEB_USERNAME=admin
WEB_PASSWORD=<geheim>
WEB_ORIGINS=http://localhost:5173
ES_HOST=...   ES_USER=...   ES_PASSWORD=...   ES_INDEX=emails
```

## Skripte

| Befehl | Zweck |
|---|---|
| `npm run dev` | Dev-Server mit HMR |
| `npm run build` | Typecheck + Produktions-Build nach `dist/` |
| `npm run preview` | gebautes Bundle lokal ausliefern |
| `npm run typecheck` | nur TypeScript prüfen |

## Struktur

```
src/
├── api/            client.ts (Fetch-Wrapper, credentials: include) + types.ts
├── auth/           AuthContext (Session laden, Login/Logout)
├── components/     Layout (AppBar)
├── pages/          LoginPage · SearchPage (DataGrid) · MailDetailPage
├── theme.ts        MUI-Theme
├── App.tsx         Routing + Auth-Gate
└── main.tsx        Provider (Theme, QueryClient, Auth, Router)
```

## Status

Phase 2 (Grundgerüst): Login, Suche → DataGrid, Mail-Detail (Body/Anhänge/PDF).
Roadmap siehe Confluence „mailarc-web & client-API".
