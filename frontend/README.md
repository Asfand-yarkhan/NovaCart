# NovaCart storefront

React 19 + Vite. See the [project README](../README.md) for setup.

```bash
npm run dev       # http://localhost:5173 (proxies /api to http://localhost:5000)
npm run build     # production build in dist/
npm run lint
```

Environment variables (optional):

| Name | Purpose |
|------|---------|
| `VITE_API_URL` | API origin when it is not served from the same domain, e.g. `https://api.novacart.pk` |
| `VITE_SITE_URL` | Public site URL used for canonical and Open Graph links |
| `VITE_PROXY_TARGET` | Dev proxy target, defaults to `http://localhost:5000` |

Styling is plain CSS with design tokens in `src/styles/tokens.css`. Light and dark themes are defined there; components only use tokens.
