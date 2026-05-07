# VPNMan React Frontend

This is the new side-by-side React frontend for VPNMan.

## Scripts

- `npm run dev` - start local Vite dev server
- `npm run build` - build production static files into `../static-react`
- `npm run test` - run Vitest
- `npm run lint` - run ESLint

## Backend Integration

- Vite dev server proxies `/api`, `/auth`, and `/account` to `http://localhost:5000`
- Production build is served by Flask from `/react`
