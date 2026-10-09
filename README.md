# IML DIGITAL

Plateforme de gestion et de suivi des porteurs de projets de l'Incubateur Multisectoriel de Libreville.

## Stack
- Frontend : React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod
- Backend : Node.js, Express, TypeScript, Zod, Prisma
- Base : PostgreSQL (hébergé par Supabase en développement ; sans Docker)

## Installation (développement)
1. Créer un projet sur supabase.com et récupérer les chaînes de connexion
   (Project Settings > Database).
2. `copy .env.example backend\.env` puis renseigner `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`.
3. Backend :
   ```
   cd backend
   npm install
   npx prisma migrate dev --name init
   npm run prisma:seed
   npm run dev
   ```
4. Frontend (autre terminal) :
   ```
   cd frontend
   npm install
   npm run dev
   ```
5. Ouvrir http://localhost:5173 : la page affiche l'état réel de l'API et de la base.

## Vérifications
- `cd backend && npm run typecheck && npm test`
- `cd frontend && npm run build`

## Sécurité
Ne jamais committer `.env`. Le seed ne crée que les rôles : aucune donnée ni compte de démonstration.
