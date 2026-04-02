# RIS

## Environment variables

Copy `.env.example` to `.env` and fill in values from your Supabase project. Do not commit `.env`. Client-side code only uses `VITE_*` variables (see Vite docs); never put service role or other server-only secrets in `VITE_*`.

## How to run locally

Requirements: Node.js and npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

```sh
# Install dependencies
npm i

# Start the development server
npm run dev
```

## Tech stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Deploy

Build and serve:

```sh
npm run build
npm run start
```

The `start` script serves the built app from `dist` (e.g. for Render or other static hosting).
