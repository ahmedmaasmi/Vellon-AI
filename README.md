This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Docker (full stack)

From the repo root you can run the backend (FastAPI, Postgres, Redis) and frontend (Next.js) together:

```bash
# Ensure backend/.env exists (copy from backend/.env.example). For Docker, use hostnames postgres and redis:
#   DATABASE_URL=postgresql+asyncpg://user:password@postgres:5432/app
#   REDIS_URL=redis://redis:6379/0
docker compose up --build
```

- Frontend: http://localhost:3000  
- API: http://localhost:8000  

Production overrides (no host ports for DB/Redis): `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`

## Getting Started

Frontend code lives in the `frontend/` directory. To run the development server:

```bash
cd frontend
npm run dev
# or yarn dev / pnpm dev / bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser. Edit `frontend/src/app/` and the page auto-updates as you edit.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
